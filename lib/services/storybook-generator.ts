/**
 * Storybook generation service
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithBasePhotoAndCharacter } from './image-generation'
import { uploadToStorage } from '@/lib/supabase/storage'
import {
  getCharacterVariations,
  generateCharacterVariations,
} from './character-variation-generator'

interface SceneTemplate {
  scene_number: number
  script_text: string
  base_photo: string // filename from /public/day-at-the-zoo/
  child_photo: 'front' | 'left' | 'right' // which character variation to use
  insertion_prompt: string // scene-specific insertion instructions
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

  const userId = storybook.user_id
  const scenes = template.script_data.scenes as SceneTemplate[]
  const totalScenes = scenes.length

  // Check for existing character variations, generate if needed
  console.log(`\n=== CHECKING CHARACTER VARIATIONS ===`)
  console.log(`Character ID: ${character.id}`)
  console.log(`Template ID: ${template.id}`)
  let variations = await getCharacterVariations(character.id, template.id)
  
  if (!variations) {
    console.log(`No existing variations found. Generating character variations...`)
    try {
      variations = await generateCharacterVariations(
        character.id,
        template.id,
        character.front_photo_url,
        userId
      )
      console.log(`✅ Character variations generated successfully`)
    } catch (error: any) {
      console.error(`❌ Failed to generate character variations:`, error)
      await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'failed',
          error_message: `Failed to generate character variations: ${error.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)
      throw error // Stop the process
    }
  } else {
    console.log(`✅ Using existing character variations:`)
    console.log(`  Front: ${variations.front_variation_url}`)
    console.log(`  Left: ${variations.left_variation_url}`)
    console.log(`  Right: ${variations.right_variation_url}`)
  }
  console.log('=====================================\n')

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
        if (!sceneTemplate.base_photo || sceneTemplate.base_photo.trim() === '') {
          throw new Error(`Scene ${sceneTemplate.scene_number} missing base_photo field`)
        }
        if (!sceneTemplate.child_photo || !['front', 'left', 'right'].includes(sceneTemplate.child_photo)) {
          throw new Error(`Scene ${sceneTemplate.scene_number} missing or invalid child_photo field`)
        }
        if (!sceneTemplate.insertion_prompt || sceneTemplate.insertion_prompt.trim() === '') {
          throw new Error(`Scene ${sceneTemplate.scene_number} missing insertion_prompt field`)
        }

        // Get the appropriate character variation URL
        let characterVariationUrl: string
        switch (sceneTemplate.child_photo) {
          case 'front':
            characterVariationUrl = variations.front_variation_url
            break
          case 'left':
            characterVariationUrl = variations.left_variation_url
            break
          case 'right':
            characterVariationUrl = variations.right_variation_url
            break
          default:
            throw new Error(`Invalid child_photo value: ${sceneTemplate.child_photo}`)
        }

        if (!characterVariationUrl) {
          throw new Error(`Character variation URL not found for ${sceneTemplate.child_photo} view`)
        }

        // Construct base photo path (from /public/day-at-the-zoo/)
        const basePhotoPath = `/day-at-the-zoo/${sceneTemplate.base_photo}`

        console.log(`\n=== SCENE ${sceneTemplate.scene_number} GENERATION ===`)
        console.log(`Character: ${character.name}`)
        console.log(`Base photo path: ${basePhotoPath}`)
        console.log(`Character variation type: ${sceneTemplate.child_photo}`)
        console.log(`Character variation URL: ${characterVariationUrl}`)
        console.log(`\n--- INSERTION PROMPT ---`)
        console.log(sceneTemplate.insertion_prompt)
        console.log(`\n--- END INSERTION PROMPT ---`)
        console.log(`Aspect ratio: ${sceneTemplate.aspect_ratio || 'match_input_image'}`)
        console.log('=====================================\n')

        // Generate image using base photo + character variation + insertion prompt
        const generatedImageUrl = await generateImageWithBasePhotoAndCharacter(
          basePhotoPath,
          characterVariationUrl,
          sceneTemplate.insertion_prompt,
          sceneTemplate.aspect_ratio || 'match_input_image'
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
        // Replace [Name] and [NAME] placeholders with character name
        const scriptText = sceneTemplate.script_text
          .replace(/\[Name\]/g, character.name)
          .replace(/\[NAME\]/g, character.name.toUpperCase())
          .replace(/{character_name}/g, character.name)

        const sceneData = {
          scene_number: sceneTemplate.scene_number,
          image_url: storedImageUrl,
          text: scriptText,
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

