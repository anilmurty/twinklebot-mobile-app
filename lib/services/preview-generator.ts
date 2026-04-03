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
import { generateImageWithGemini, isGeminiAvailable } from './gemini-image'
import { uploadToStorage } from '@/lib/supabase/storage'

type StorybookStyle = 'natural' | 'storybook' | 'comic-book' | 'cartoon'

const STYLE_MODIFIERS: Record<StorybookStyle, string> = {
  natural: '',
  storybook:
    'render the child and transform the entire scene in a watercolor children\'s book illustration style, soft painterly textures, warm pastel palette, gentle visible brushstrokes, professional picture book quality, maintaining consistent style across all scene elements.',
  'comic-book':
    'render the child and transform the entire scene in comic book art style, bold black ink outlines applied consistently to all elements including background, flat vivid colors, dynamic composition, high contrast, professional comic illustration.',
  cartoon:
    'render the child and transform the entire scene in 3D animated movie style, smooth surfaces, vibrant saturated colors, soft studio lighting, Pixar-quality render, bright and cheerful, consistent style across child and background.',
}

interface SceneTemplate {
  scene_number: number
  headline?: string
  script_text: string
  base_photo: string
  child_photo: 'front' | 'left' | 'right' | 'original'
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
  const previewStartTime = Date.now()
  console.log(`[PREVIEW] Starting preview generation for storybook ${storybookId} at ${new Date().toISOString()}`)

  // Get storybook with related data
  const dbQueryStart = Date.now()
  const { data: storybook, error: sbError } = await supabaseAdmin
    .from('storybooks')
    .select(`
      *,
      character:characters(*),
      template:story_templates(*)
    `)
    .eq('id', storybookId)
    .single()
  console.log(`[TIMING] Database query (storybook+character+template): ${Date.now() - dbQueryStart}ms`)

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
    const variationsCheckStart = Date.now()
    console.log(`[PREVIEW] Step 1: Checking character variations...`)
    let variations = await getCharacterVariations(character.id, template.id)
    console.log(`[TIMING] Character variations check: ${Date.now() - variationsCheckStart}ms`)

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
      // Verify the files actually exist in storage before using them
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      const extractStoragePath = (url: string): string | null => {
        const publicUrlMatch = url.match(/\/character-variations\/(.+)$/)
        if (publicUrlMatch) return publicUrlMatch[1]
        const relativeMatch = url.match(/^character-variations\/(.+)$/)
        if (relativeMatch) return relativeMatch[1]
        if (!url.includes('http') && !url.includes('character-variations')) return url
        return null
      }

      const frontPath = extractStoragePath(variations.front_variation_url)
      let variationsValid = false
      if (frontPath) {
        try {
          await getSignedUrl('character-variations', frontPath, 60) // Short expiry for check
          variationsValid = true
          console.log(`[PREVIEW] Verified character variation files exist in storage`)
        } catch (error: any) {
          console.warn(`[PREVIEW] Character variation file not found in storage, will regenerate:`, error.message)
          variationsValid = false
        }
      } else {
        console.warn(`[PREVIEW] Could not extract path from variation URL: ${variations.front_variation_url}`)
        variationsValid = false
      }

      if (!variationsValid) {
        console.log(`[PREVIEW] Character variation files missing or invalid, regenerating...`)
        // Delete the invalid record
        await supabaseAdmin
          .from('character_variations')
          .delete()
          .eq('character_id', character.id)
          .eq('template_id', template.id)
        
        // Update progress
        await supabaseAdmin
          .from('storybooks')
          .update({ progress: 10, updated_at: new Date().toISOString() })
          .eq('id', storybookId)

        // Regenerate
        try {
          variations = await generateCharacterVariations(
            character.id,
            template.id,
            character.front_photo_url,
            userId,
            storybookId,
            true
          )
          console.log(`[PREVIEW] Character variations regenerated successfully`)
          console.log(`[PREVIEW] New variation URLs:`, {
            front: variations.front_variation_url,
            left: variations.left_variation_url,
            right: variations.right_variation_url,
          })
        } catch (regenerateError: any) {
          console.error(`[PREVIEW] Failed to regenerate character variations:`, regenerateError)
          throw new Error(`Failed to regenerate character variations: ${regenerateError.message}`)
        }
      } else {
        await supabaseAdmin
          .from('storybooks')
          .update({ progress: 50, updated_at: new Date().toISOString() })
          .eq('id', storybookId)
      }
    }

    // Step 2: Generate first scene
    console.log(`[PREVIEW] Step 2: Generating first scene...`)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 60, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    const { getSignedUrl } = await import('@/lib/supabase/storage')
    let signedVariationUrl: string

    if (firstScene.child_photo === 'original') {
      // Use the child's original uploaded photo
      const originalPhotoUrl = character.front_photo_url
      if (!originalPhotoUrl) {
        throw new Error(`Character original photo URL not found`)
      }
      const match = originalPhotoUrl.match(/character-photos\/(.+)$/)
      if (match) {
        signedVariationUrl = await getSignedUrl('character-photos', match[1], 3600)
      } else {
        signedVariationUrl = originalPhotoUrl
      }
      console.log(`[PREVIEW] Using child's original photo for scene ${firstScene.scene_number}`)
    } else {
      // Use the character variation (front/left/right)
      const characterVariationUrl = variations.front_variation_url

      if (!characterVariationUrl) {
        throw new Error(`Character variation URL not found`)
      }

      const extractStoragePath = (url: string): string | null => {
        const publicUrlMatch = url.match(/\/character-variations\/(.+)$/)
        if (publicUrlMatch) return publicUrlMatch[1]
        const relativeMatch = url.match(/^character-variations\/(.+)$/)
        if (relativeMatch) return relativeMatch[1]
        if (!url.includes('http') && !url.includes('character-variations')) return url
        return null
      }

      const variationPath = extractStoragePath(characterVariationUrl)
      if (!variationPath) {
        console.error(`[PREVIEW] Could not extract storage path from variation URL: ${characterVariationUrl}`)
        throw new Error(`Could not extract storage path from variation URL: ${characterVariationUrl}`)
      }

      console.log(`[PREVIEW] Extracted storage path: ${variationPath} from URL: ${characterVariationUrl}`)

      try {
        signedVariationUrl = await getSignedUrl('character-variations', variationPath, 3600)
        console.log(`[PREVIEW] Created signed URL for variation: ${signedVariationUrl.substring(0, 50)}...`)
      } catch (error: any) {
        console.warn(`[PREVIEW] Failed to create signed URL for path "${variationPath}", error: ${error.message}`)
        if (characterVariationUrl.startsWith('http')) {
          console.log(`[PREVIEW] Using public URL directly: ${characterVariationUrl}`)
          signedVariationUrl = characterVariationUrl
        } else {
          throw new Error(`Failed to create signed URL for character variation. Path: ${variationPath}, URL: ${characterVariationUrl}, Error: ${error.message}`)
        }
      }
    }

    // Construct base photo path - extract folder from template thumbnail_url
    // thumbnail_url format: "/day-at-the-zoo/cover.png" -> folder is "day-at-the-zoo"
    let basePhotoPath: string
    if (template.thumbnail_url && template.thumbnail_url.includes('/')) {
      const thumbnailParts = template.thumbnail_url.split('/')
      if (thumbnailParts.length >= 2) {
        const folder = thumbnailParts[1] // Extract folder name (e.g., "day-at-the-zoo")
        basePhotoPath = `/${folder}/${firstScene.base_photo}`
      } else {
        // Fallback: hardcode for "Day at the Zoo" template
        basePhotoPath = `/day-at-the-zoo/${firstScene.base_photo}`
      }
    } else {
      // Fallback: hardcode for "Day at the Zoo" template
      basePhotoPath = `/day-at-the-zoo/${firstScene.base_photo}`
    }

    console.log(`[PREVIEW] Constructed base photo path: ${basePhotoPath} from base_photo: ${firstScene.base_photo}`)

    // Apply style modifier to insertion prompt
    const storybookStyle = ((storybook.style as StorybookStyle) || 'natural') as StorybookStyle
    const styleModifier = STYLE_MODIFIERS[storybookStyle] || ''
    const styledPrompt = styleModifier
      ? `${firstScene.insertion_prompt} ${styleModifier}`
      : firstScene.insertion_prompt

    if (styleModifier) {
      console.log(`[PREVIEW] Applied ${storybookStyle} style modifier to prompt`)
    }

    // Generate first scene image
    const sceneFileName = `${storybookId}/scene-${firstScene.scene_number}.jpg`
    let uploadedSceneUrl: string

    if (isGeminiAvailable()) {
      // Use Google Gemini API — no polling needed
      const { getStorageUrl } = await import('@/lib/supabase/storage')
      const basePhotoStoragePath = basePhotoPath.startsWith('/') ? basePhotoPath.slice(1) : basePhotoPath
      const basePhotoUrl = getStorageUrl('story-template-assets', basePhotoStoragePath)

      console.log(`[PREVIEW] Using Gemini for scene generation`)
      const imageBuffer = await generateImageWithGemini(
        styledPrompt,
        [basePhotoUrl, signedVariationUrl],
        firstScene.aspect_ratio || '9:16'
      )

      uploadedSceneUrl = await uploadToStorage(
        'storybook-scenes',
        sceneFileName,
        imageBuffer,
        'image/jpeg'
      )
    } else {
      // Fallback: use Replicate
      console.warn('[FALLBACK] Using Replicate for preview scene generation')
      const sceneImageUrl = await generateImageWithBasePhotoAndCharacter(
        basePhotoPath,
        signedVariationUrl,
        styledPrompt,
        firstScene.aspect_ratio || '9:16',
        template.id,
        'basic'
      )

      const sceneImageResponse = await fetch(sceneImageUrl)
      const sceneImageBuffer = Buffer.from(await sceneImageResponse.arrayBuffer())

      uploadedSceneUrl = await uploadToStorage(
        'storybook-scenes',
        sceneFileName,
        sceneImageBuffer,
        'image/jpeg'
      )
    }

    console.log(`[PREVIEW] Scene image uploaded: ${uploadedSceneUrl}`)

    // Create scene object
    // Format character name: first letter uppercase, rest lowercase
    const titleCaseName = character.name.charAt(0).toUpperCase() + character.name.slice(1).toLowerCase()
    const scriptText = firstScene.script_text
      .replace(/\[Name\]/g, titleCaseName)
      .replace(/\[NAME\]/g, titleCaseName)
      .replace(/{character_name}/g, titleCaseName)
    
    const scene = {
      scene_number: firstScene.scene_number,
      headline: firstScene.headline,
      image_url: uploadedSceneUrl,
      text: scriptText,
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

    // Send push notification (best-effort, never throws)
    try {
      const { sendNotificationToUser } = await import('@/lib/services/apns-service')
      await sendNotificationToUser(
        userId,
        'Preview Ready!',
        `Your ${template.title} preview for ${character.name} is ready to view.`,
        { storybookId, type: 'preview_ready' }
      )
    } catch (err: any) {
      console.error('[PREVIEW] Failed to send notification:', err.message)
    }

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

