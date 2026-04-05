/**
 * Preview generation service
 * Generates character variations + first scene only for preview
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import {
  getCharacterVariations,
  generateCharacterVariations,
} from './character-variation-generator'
import { buildModelInput, createProviderPrediction, pollProviderPrediction } from './image-generation'
import { uploadToStorage } from '@/lib/supabase/storage'

type StorybookStyle = 'natural' | 'storybook' | 'comic-book' | 'cartoon'

const STYLE_MODIFIERS: Record<StorybookStyle, string> = {
  natural: '',
  storybook:
    'Render the entire scene in a watercolor picture book illustration style with soft painterly textures, warm pastel palette, and gentle visible brushstrokes.',
  'comic-book':
    'Render the entire scene in comic book art style with bold black ink outlines, flat vivid colors, and high contrast.',
  cartoon:
    'Render the entire scene in 3D animated movie style with smooth surfaces, vibrant saturated colors, and soft studio lighting.',
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
    // Step 1: Get pre-generated avatar (generated at upload time)
    console.log(`[PREVIEW] Step 1: Checking character avatar...`)

    const storybookStyle = ((storybook.style as StorybookStyle) || 'natural') as StorybookStyle

    const { data: charData } = await supabaseAdmin
      .from('characters')
      .select('avatar_status, avatar_cartoon_url')
      .eq('id', character.id)
      .single()

    const avatarUrl = charData?.avatar_cartoon_url as string | null

    let variations: { front_variation_url: string; left_variation_url: string; right_variation_url: string }

    if (avatarUrl && charData?.avatar_status === 'ready') {
      console.log(`[PREVIEW] Using pre-generated ${storybookStyle} avatar`)
      variations = {
        front_variation_url: avatarUrl,
        left_variation_url: avatarUrl,
        right_variation_url: avatarUrl,
      }
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 50, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    } else if (charData?.avatar_status === 'generating') {
      throw new Error('Character avatar is still being generated. Please wait and try again.')
    } else {
      // Fallback to old flow for legacy characters
      console.log(`[PREVIEW] No avatar found, falling back to character variation generation`)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 10, updated_at: new Date().toISOString() })
        .eq('id', storybookId)

      const existingVariations = await getCharacterVariations(character.id, template.id)
      if (existingVariations) {
        variations = existingVariations
      } else {
        variations = await generateCharacterVariations(
          character.id,
          template.id,
          character.front_photo_url,
          userId,
          storybookId,
          true,
        )
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
      // Use avatar if available (original photo may have been deleted after avatar generation)
      if (avatarUrl && charData?.avatar_status === 'ready') {
        const match = avatarUrl.match(/character-photos\/(.+)$/)
        if (match) {
          signedVariationUrl = await getSignedUrl('character-photos', match[1], 3600)
        } else {
          signedVariationUrl = avatarUrl
        }
        console.log(`[PREVIEW] Using avatar for 'original' scene ${firstScene.scene_number} (original photo deleted)`)
      } else {
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
      }
    } else {
      // Use the character variation (front/left/right)
      const characterVariationUrl = variations.front_variation_url

      if (!characterVariationUrl) {
        throw new Error(`Character variation URL not found`)
      }

      // Extract bucket and path from the URL (supports character-photos and character-variations buckets)
      const extractBucketAndPath = (url: string): { bucket: string; path: string } | null => {
        for (const bucket of ['character-photos', 'character-variations']) {
          const publicUrlMatch = url.match(new RegExp(`/${bucket}/(.+)$`))
          if (publicUrlMatch) return { bucket, path: publicUrlMatch[1] }
          const relativeMatch = url.match(new RegExp(`^${bucket}/(.+)$`))
          if (relativeMatch) return { bucket, path: relativeMatch[1] }
        }
        if (!url.includes('http')) return { bucket: 'character-variations', path: url }
        return null
      }

      const extracted = extractBucketAndPath(characterVariationUrl)
      if (!extracted) {
        console.error(`[PREVIEW] Could not extract storage path from variation URL: ${characterVariationUrl}`)
        throw new Error(`Could not extract storage path from variation URL: ${characterVariationUrl}`)
      }

      console.log(`[PREVIEW] Extracted bucket: ${extracted.bucket}, path: ${extracted.path} from URL: ${characterVariationUrl}`)

      try {
        signedVariationUrl = await getSignedUrl(extracted.bucket, extracted.path, 3600)
        console.log(`[PREVIEW] Created signed URL for variation: ${signedVariationUrl.substring(0, 50)}...`)
      } catch (error: any) {
        console.warn(`[PREVIEW] Failed to create signed URL for path "${extracted.path}", error: ${error.message}`)
        if (characterVariationUrl.startsWith('http')) {
          console.log(`[PREVIEW] Using public URL directly: ${characterVariationUrl}`)
          signedVariationUrl = characterVariationUrl
        } else {
          throw new Error(`Failed to create signed URL for character variation. Bucket: ${extracted.bucket}, Path: ${extracted.path}, Error: ${error.message}`)
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

    // Fetch selected look for this storybook
    let selectedLook: { attire_image_url: string; prompt_modifier: string; is_original: boolean } | null = null
    const { data: lookData } = await supabaseAdmin
      .from('storybooks')
      .select('look_id, character_looks:look_id(attire_image_url, prompt_modifier, is_original)')
      .eq('id', storybookId)
      .single()

    if (lookData?.look_id && lookData.character_looks) {
      const look = Array.isArray(lookData.character_looks)
        ? lookData.character_looks[0]
        : lookData.character_looks
      selectedLook = look as any
    }

    // Build insertion prompt using natural language referencing for FLUX.2 Pro on Replicate
    // For 'original' scenes (e.g. PJ/bedroom scenes), skip attire — let the base scene dictate clothing
    const styleModifier = STYLE_MODIFIERS[storybookStyle] || ''
    const useAttire = selectedLook && !selectedLook.is_original && firstScene.child_photo !== 'original'
    let insertionPrompt: string
    if (useAttire) {
      insertionPrompt = 'Replace the character in the scene with the character from the photo with the white background. Match the pose, position, and body orientation of the existing child in scene. The child in the final image must have the face, hair, skin tone, and all features from the child in the white background photo. Dress the child in the complete outfit shown in the third image, including shoes and footwear. Keep the background, lighting, art style, and all other elements of scene completely unchanged.'
    } else {
      insertionPrompt = 'Replace the character in the scene with the character from the photo with the white background. Match the pose, position, and body orientation of the existing child in scene. The child in the final image must have the face, hair, skin tone, and all features from the child in the white background photo. Dress the child in the complete outfit shown in white background photo, including shoes and footwear. Keep the background, lighting, art style, and all other elements of scene completely unchanged.'
    }
    const styledPrompt = styleModifier
      ? `${insertionPrompt} ${styleModifier}`
      : insertionPrompt

    console.log(`[PREVIEW] Using FLUX.2 prompt with ${storybookStyle} modifier${useAttire ? ' (custom look)' : firstScene.child_photo === 'original' ? ' (original/no attire)' : ''}`)

    // Generate first scene image
    const sceneFileName = `${storybookId}/scene-${firstScene.scene_number}.jpg`
    let uploadedSceneUrl: string

    {
      // Generate scene via Replicate (FLUX.2 Pro)
      const { getStorageUrl } = await import('@/lib/supabase/storage')
      const basePhotoStoragePath = basePhotoPath.startsWith('/') ? basePhotoPath.slice(1) : basePhotoPath
      const basePhotoUrl = getStorageUrl('story-template-assets', basePhotoStoragePath)

      // Build reference images: image1=scene, image2=character, image3=attire (optional)
      const referenceImages = [basePhotoUrl, signedVariationUrl]
      if (useAttire && selectedLook.attire_image_url) {
        let attireUrl = selectedLook.attire_image_url
        if (!attireUrl.startsWith('http')) {
          const attirePath = attireUrl.startsWith('/') ? attireUrl.slice(1) : attireUrl
          attireUrl = getStorageUrl('story-template-assets', attirePath)
        }
        referenceImages.push(attireUrl)
      }

      console.log(`[FLUX] Generating preview scene with ${referenceImages.length} reference images`)
      const modelIdentifier = process.env.IMAGE_MODEL_VERSION || 'black-forest-labs/flux-2-pro'
      const predictionId = await createProviderPrediction(
        modelIdentifier,
        buildModelInput(modelIdentifier, styledPrompt, referenceImages, firstScene.aspect_ratio || '9:16')
      )

      const sceneImageUrl = await pollProviderPrediction(predictionId)

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

