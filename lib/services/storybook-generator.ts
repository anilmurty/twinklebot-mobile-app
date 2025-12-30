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
  headline?: string
  script_text: string
  base_photo: string // filename from Supabase Storage (story-template-assets/day-at-the-zoo/)
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
      // Set progress to 0% - "Starting character creation"
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 0, updated_at: new Date().toISOString() })
        .eq('id', storybookId)

      variations = await generateCharacterVariations(
        character.id,
        template.id,
        character.front_photo_url,
        userId,
        storybookId // Pass storybookId to update progress
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
    // Character variations already exist, set progress to 95% (character generation complete)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 95, updated_at: new Date().toISOString() })
      .eq('id', storybookId)
  }
  console.log('=====================================\n')

  // Initialize scenes array if not exists
  let generatedScenes = Array.isArray(storybook.scenes) ? storybook.scenes : []

  // Set progress to 0% for "Starting storybook generation"
  await supabaseAdmin
    .from('storybooks')
    .update({ progress: 100, updated_at: new Date().toISOString() }) // 100 = starting scene generation
    .eq('id', storybookId)

  // Helper function to generate a single scene
  const generateScene = async (sceneTemplate: SceneTemplate, attempt: number = 1): Promise<void> => {
    // Check if already generated
    const existingScene = generatedScenes.find(
      (s: any) => s.scene_number === sceneTemplate.scene_number
    )

    if (existingScene?.image_url) {
      console.log(`Scene ${sceneTemplate.scene_number} already generated, skipping`)
      return
    }

    try {
      console.log(`Generating scene ${sceneTemplate.scene_number} (attempt ${attempt}/3)`)

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

      // Convert character variation URL to signed URL for Replicate access
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      const extractStoragePath = (url: string): string | null => {
        const match = url.match(/character-variations\/(.+)$/)
        if (match) {
          return match[1]
        }
        return null
      }

      const variationStoragePath = extractStoragePath(characterVariationUrl)
      if (!variationStoragePath) {
        throw new Error(`Could not extract storage path from character variation URL: ${characterVariationUrl}`)
      }

      // Create signed URL (valid for 1 hour) for Replicate to access
      characterVariationUrl = await getSignedUrl('character-variations', variationStoragePath, 3600)

      // Construct base photo path
      const basePhotoPath = `/day-at-the-zoo/${sceneTemplate.base_photo}`

      console.log(`\n=== SCENE ${sceneTemplate.scene_number} GENERATION ===`)
      console.log(`Character: ${character.name}`)
      console.log(`Base photo path: ${basePhotoPath}`)
      console.log(`Character variation type: ${sceneTemplate.child_photo}`)
      console.log(`\n--- INSERTION PROMPT ---`)
      console.log(sceneTemplate.insertion_prompt)
      console.log(`\n--- END INSERTION PROMPT ---`)
      console.log('=====================================\n')

      // Create prediction
      const { createBasePhotoAndCharacterPrediction, pollPrediction } = await import('./image-generation')
      const predictionId = await createBasePhotoAndCharacterPrediction(
        basePhotoPath,
        characterVariationUrl,
        sceneTemplate.insertion_prompt,
        sceneTemplate.aspect_ratio || 'match_input_image'
      )
      
      console.log(`Created prediction ${predictionId} for scene ${sceneTemplate.scene_number}`)

      // Update progress when prediction is created
      const sceneProgress = Math.round(((sceneTemplate.scene_number) / totalScenes) * 100)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 100 + sceneProgress, updated_at: new Date().toISOString() })
        .eq('id', storybookId)

      // Poll for the result
      const generatedImageUrl = await pollPrediction(predictionId)
      console.log(`Scene ${sceneTemplate.scene_number} generated successfully:`, generatedImageUrl)

      // Download image from Replicate
      const imageResponse = await fetch(generatedImageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()

      // Upload to Supabase Storage
      const { uploadToStorage } = await import('@/lib/supabase/storage')
      const storedImageUrl = await uploadToStorage(
        'storybook-scenes',
        `${storybookId}/scene-${sceneTemplate.scene_number}.jpg`,
        imageBuffer,
        'image/jpeg'
      )

      // Create scene data
      const titleCaseName = character.name.charAt(0).toUpperCase() + character.name.slice(1).toLowerCase()
      const scriptText = sceneTemplate.script_text
        .replace(/\[Name\]/g, titleCaseName)
        .replace(/\[NAME\]/g, titleCaseName)
        .replace(/{character_name}/g, titleCaseName)

      const sceneData = {
        scene_number: sceneTemplate.scene_number,
        headline: sceneTemplate.headline,
        image_url: storedImageUrl,
        text: scriptText,
        generated_at: new Date().toISOString(),
      }

      // Update storybook scenes array atomically
      const { data: currentStorybook } = await supabaseAdmin
        .from('storybooks')
        .select('scenes')
        .eq('id', storybookId)
        .single()

      const currentScenes = Array.isArray(currentStorybook?.scenes) ? currentStorybook.scenes : []
      const updatedScenes = [...currentScenes]
      const existingIndex = updatedScenes.findIndex(
        (s: any) => s.scene_number === sceneTemplate.scene_number
      )

      if (existingIndex >= 0) {
        updatedScenes[existingIndex] = sceneData
      } else {
        updatedScenes.push(sceneData)
      }

      // Update database with new scene
      await supabaseAdmin
        .from('storybooks')
        .update({
          scenes: updatedScenes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)

      // Update local state
      generatedScenes = updatedScenes

      console.log(`✅ Scene ${sceneTemplate.scene_number} completed successfully`)
    } catch (error: any) {
      console.error(`Scene ${sceneTemplate.scene_number} attempt ${attempt} failed:`, error.message)
      
      // Retry logic: up to 3 attempts
      if (attempt < 3) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        return generateScene(sceneTemplate, attempt + 1)
      } else {
        // All retries failed
        throw new Error(`Failed to generate scene ${sceneTemplate.scene_number} after 3 attempts: ${error.message}`)
      }
    }
  }

  // Generate all scenes in parallel
  console.log(`\n=== STARTING PARALLEL SCENE GENERATION ===`)
  console.log(`Generating ${totalScenes} scenes concurrently...`)
  
  const scenePromises = scenes.map(sceneTemplate => generateScene(sceneTemplate))
  const results = await Promise.allSettled(scenePromises)
  
  // Check for failures
  const failures = results
    .map((result, index) => ({ result, sceneNumber: scenes[index].scene_number }))
    .filter(({ result }) => result.status === 'rejected')

  if (failures.length > 0) {
    const errorMessages = failures.map(({ result, sceneNumber }) => 
      `Scene ${sceneNumber}: ${result.status === 'rejected' ? result.reason?.message || 'Unknown error' : ''}`
    ).join('\n')
    
    await supabaseAdmin
      .from('storybooks')
      .update({
        status: 'failed',
        error_message: `Failed to generate ${failures.length} scene(s):\n${errorMessages}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybookId)

    throw new Error(`Failed to generate ${failures.length} scene(s)`)
  }

  // All scenes generated successfully
  const finalProgress = 100 + 100 // 200 = all scenes complete (displays as 100%)
  await supabaseAdmin
    .from('storybooks')
    .update({
      status: 'completed',
      progress: finalProgress,
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

  console.log(`✅ Storybook ${storybookId} generation completed - all ${totalScenes} scenes generated successfully`)
}
