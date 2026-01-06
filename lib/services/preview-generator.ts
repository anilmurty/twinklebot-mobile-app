/**
 * Preview generation service
 * Generates character variations + first scene only for preview
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getCharacterVariations,
  generateCharacterVariations,
} from './character-variation-generator'
import { generateImageWithBasePhotoAndCharacter } from './image-generation'
import { uploadToStorage } from '@/lib/supabase/storage'

interface SceneTemplate {
  scene_number: number
  headline?: string
  script_text: string
  base_photo: string
  child_photo: 'front' | 'left' | 'right'
  insertion_prompt: string
  aspect_ratio?: string
}

export interface PreviewResult {
  storybookId: string
  firstSceneImageUrl: string
  characterName: string
  templateTitle: string
}

/**
 * Generate preview: character variations + first scene only
 */
export async function generatePreview(storybookId: string): Promise<PreviewResult> {
  console.log(`[PREVIEW] Starting preview generation for storybook ${storybookId}`)

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

  const character = storybook.character
  const template = storybook.template

  if (!character || !template) {
    throw new Error('Missing character or template data')
  }

  const userId = storybook.user_id
  const scenes = template.script_data.scenes as SceneTemplate[]
  
  if (!scenes || scenes.length === 0) {
    throw new Error('Template has no scenes')
  }

  // Get first scene (lowest scene_number)
  const firstScene = scenes.reduce((prev, curr) => 
    (curr.scene_number < prev.scene_number) ? curr : prev
  )

  console.log(`[PREVIEW] First scene: scene_number=${firstScene.scene_number}`)

  try {
    // Step 1: Generate or get character variations
    console.log(`[PREVIEW] Step 1: Checking character variations...`)
    let variations = await getCharacterVariations(character.id, template.id)

    if (!variations) {
      console.log(`[PREVIEW] No existing variations found. Generating...`)
      
      // Update progress
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 10, updated_at: new Date().toISOString() })
        .eq('id', storybookId)

      variations = await generateCharacterVariations(
        character.id,
        template.id,
        character.front_photo_url,
        userId,
        storybookId,
        true // Skip existence check
      )
      console.log(`[PREVIEW] Character variations generated`)
    } else {
      console.log(`[PREVIEW] Using existing character variations`)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 50, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    }

    // Step 2: Generate first scene
    console.log(`[PREVIEW] Step 2: Generating first scene...`)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 60, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    // Get the appropriate character variation URL
    let characterVariationUrl: string
    switch (firstScene.child_photo) {
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
        throw new Error(`Invalid child_photo value: ${firstScene.child_photo}`)
    }

    if (!characterVariationUrl) {
      throw new Error(`Character variation URL not found for ${firstScene.child_photo} view`)
    }

    // Convert character variation URL to signed URL for Replicate access
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    const extractStoragePath = (url: string): string | null => {
      const match = url.match(/character-variations\/(.+)$/)
      return match ? match[1] : null
    }

    const variationPath = extractStoragePath(characterVariationUrl)
    if (!variationPath) {
      throw new Error(`Could not extract storage path from variation URL: ${characterVariationUrl}`)
    }

    const signedVariationUrl = await getSignedUrl('character-variations', variationPath, 3600)

    // Generate first scene image
    const sceneImageUrl = await generateImageWithBasePhotoAndCharacter(
      firstScene.base_photo,
      signedVariationUrl,
      firstScene.insertion_prompt,
      firstScene.aspect_ratio || 'match_input_image',
      template.id
    )

    console.log(`[PREVIEW] First scene image generated: ${sceneImageUrl}`)

    // Upload scene image to storage
    const sceneImageResponse = await fetch(sceneImageUrl)
    const sceneImageBlob = await sceneImageResponse.blob()
    const sceneImageBuffer = Buffer.from(await sceneImageBlob.arrayBuffer())

    const sceneFileName = `${storybookId}/scene-${firstScene.scene_number}.png`
    const uploadedSceneUrl = await uploadToStorage(
      'storybook-scenes',
      sceneFileName,
      sceneImageBuffer,
      'image/png'
    )

    console.log(`[PREVIEW] Scene image uploaded: ${uploadedSceneUrl}`)

    // Create scene object
    const scene = {
      scene_number: firstScene.scene_number,
      image_url: uploadedSceneUrl,
      text: firstScene.script_text.replace('{character_name}', character.name),
      number: firstScene.scene_number,
      generated_at: new Date().toISOString(),
    }

    // Update storybook with preview scene and set status to preview_pending
    await supabaseAdmin
      .from('storybooks')
      .update({
        status: 'preview_pending',
        progress: 100,
        scenes: [scene],
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybookId)

    console.log(`[PREVIEW] Preview generation complete for storybook ${storybookId}`)

    return {
      storybookId,
      firstSceneImageUrl: uploadedSceneUrl,
      characterName: character.name,
      templateTitle: template.title,
    }
  } catch (error: any) {
    console.error(`[PREVIEW] Preview generation failed:`, error)
    
    // Update storybook status to failed
    await supabaseAdmin
      .from('storybooks')
      .update({
        status: 'failed',
        error_message: `Preview generation failed: ${error.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybookId)

    throw error
  }
}

