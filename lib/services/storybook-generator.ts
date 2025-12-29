/**
 * Storybook generation service
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { buildNanoBananaPrompt } from './prompt-builder'
import { generateImageWithNanoBanana } from './image-generation'
import { uploadToStorage } from '@/lib/supabase/storage'

interface SceneTemplate {
  scene_number: number
  script_text: string
  action: string
  detail: string
  number?: number
  letter?: string
  aspect_ratio?: string
}

export async function generateStorybook(storybookId: string): Promise<void> {
  // Get storybook with related data
  const { data: storybook, error: sbError } = await supabaseAdmin
    .from('storybooks')
    .select(`
      *,
      character:characters(*),
      template:story_templates(*)
    `)
    .eq('id', storybookId)
    .single()

  if (sbError || !storybook) {
    throw new Error(`Storybook not found: ${storybookId}`)
  }

  // Check if already completed
  if (storybook.status === 'completed') {
    return
  }

  // Update status to generating
  await supabaseAdmin
    .from('storybooks')
    .update({ status: 'generating' })
    .eq('id', storybookId)

  const character = storybook.character
  const template = storybook.template

  if (!character || !template) {
    throw new Error('Missing character or template data')
  }

  // Get signed URLs for character photos (Replicate needs accessible URLs)
  // Character photos are in private bucket, so we need signed URLs
  const { getSignedUrl } = await import('@/lib/supabase/storage')
  const userId = storybook.user_id
  
  // Extract storage path from URL or construct it
  const getPhotoPath = (url: string) => {
    if (!url || url.trim() === '') {
      throw new Error('Character photo URL is missing')
    }
    // Extract path from Supabase Storage URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/character-photos/user_id/char_id/front.jpg
    // Or: https://xxx.supabase.co/storage/v1/object/sign/character-photos/...
    const match = url.match(/character-photos\/(.+)$/)
    if (match) {
      return match[1]
    }
    // Fallback: construct path from character ID
    return `${userId}/${character.id}/front.jpg`
  }

  // Create signed URL (valid for 1 hour - enough for generation)
  // Only use the front photo (single photo upload)
  const frontPhotoPath = getPhotoPath(character.front_photo_url)

  const characterPhoto = await getSignedUrl('character-photos', frontPhotoPath, 3600)
  
  console.log('Created signed URL for character photo (expires in 1 hour)')

  const fixedParts = template.fixed_prompt_parts
  const scenes = template.script_data.scenes as SceneTemplate[]
  const totalScenes = scenes.length

  // Initialize scenes array if not exists
  let generatedScenes = Array.isArray(storybook.scenes) ? storybook.scenes : []

  // Process each scene
  for (let i = 0; i < totalScenes; i++) {
    const sceneTemplate = scenes[i]

    // Check if already generated
    const existingScene = generatedScenes.find(
      (s: any) => s.scene_number === sceneTemplate.scene_number
    )

    if (existingScene?.image_url) {
      console.log(`Scene ${sceneTemplate.scene_number} already generated, skipping`)
      continue
    }

    // Retry logic: 3 attempts
    let sceneGenerated = false
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Generating scene ${sceneTemplate.scene_number} (attempt ${attempt}/3)`
        )

        // Validate required fields
        if (!fixedParts.subject) {
          throw new Error('Template missing subject in fixed_prompt_parts')
        }
        if (!fixedParts.style) {
          throw new Error('Template missing style in fixed_prompt_parts')
        }
        if (!sceneTemplate.action || sceneTemplate.action.trim() === '') {
          throw new Error(`Scene ${sceneTemplate.scene_number} missing action field`)
        }

        // Build prompt
        const prompt = buildNanoBananaPrompt(
          {
            subject: fixedParts.subject,
            style: fixedParts.style,
          },
          {
            action: sceneTemplate.action,
          },
          character.name
        )

        console.log(`\n=== Scene ${sceneTemplate.scene_number} ===`)
        console.log(`Character: ${character.name}`)
        console.log(`Prompt length: ${prompt.length} chars`)
        console.log(`Full prompt:\n${prompt}`)
        console.log(`Character photo: ${characterPhoto}`)

        // Generate image
        const generatedImageUrl = await generateImageWithNanoBanana(
          prompt,
          [characterPhoto], // Send only one image
          sceneTemplate.aspect_ratio || '9:16'
        )
        
        console.log(`Scene ${sceneTemplate.scene_number} generated successfully:`, generatedImageUrl)

        // Download image from Replicate
        const imageResponse = await fetch(generatedImageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()

        // Upload to Supabase Storage
        const storedImageUrl = await uploadToStorage(
          'storybook-scenes',
          `${storybookId}/scene-${sceneTemplate.scene_number}.jpg`,
          imageBuffer,
          'image/jpeg'
        )

        // Create scene data
        const sceneData = {
          scene_number: sceneTemplate.scene_number,
          image_url: storedImageUrl,
          text: sceneTemplate.script_text.replace(
            /{character_name}/g,
            character.name
          ),
          number: sceneTemplate.number,
          letter: sceneTemplate.letter,
          generated_at: new Date().toISOString(),
        }

        // Update storybook scenes array
        const updatedScenes = [...generatedScenes]
        const existingIndex = updatedScenes.findIndex(
          (s: any) => s.scene_number === sceneTemplate.scene_number
        )

        if (existingIndex >= 0) {
          updatedScenes[existingIndex] = sceneData
        } else {
          updatedScenes.push(sceneData)
        }

        generatedScenes = updatedScenes

        // Update storybook in database
        const progress = Math.round(((i + 1) / totalScenes) * 100)
        await supabaseAdmin
          .from('storybooks')
          .update({
            scenes: generatedScenes,
            progress,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)

        sceneGenerated = true
        break // Success, exit retry loop
      } catch (error: any) {
        lastError = error
        console.error(
          `Scene ${sceneTemplate.scene_number} attempt ${attempt} failed:`,
          error.message
        )

        // Wait before retry (exponential backoff)
        if (attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          )
        }
      }
    }

    if (!sceneGenerated) {
      // All retries failed
      await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'failed',
          error_message: `Failed to generate scene ${sceneTemplate.scene_number} after 3 attempts: ${lastError?.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)

      throw new Error(
        `Failed to generate scene ${sceneTemplate.scene_number}: ${lastError?.message}`
      )
    }
  }

  // All scenes generated successfully
  await supabaseAdmin
    .from('storybooks')
    .update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', storybookId)

  // Update generation job status
  await supabaseAdmin
    .from('generation_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('storybook_id', storybookId)

  console.log(`Storybook ${storybookId} generation completed`)
}

