/**
 * Preview generation service
 * Generates first scene only for preview
 */

import { supabaseAdmin } from '@/lib/supabase/server'
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

    if (avatarUrl && charData?.avatar_status === 'ready') {
      console.log(`[PREVIEW] Using pre-generated avatar`)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 50, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    } else if (charData?.avatar_status === 'generating') {
      throw new Error('Character avatar is still being generated. Please wait and try again.')
    } else {
      throw new Error('Character avatar not found. Please re-create the character.')
    }

    // Step 2: Generate first scene
    console.log(`[PREVIEW] Step 2: Generating first scene...`)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 60, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    // Get signed URL for the avatar
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    let signedAvatarUrl: string
    const avatarMatch = avatarUrl.match(/character-photos\/(.+)$/)
    if (avatarMatch) {
      signedAvatarUrl = await getSignedUrl('character-photos', avatarMatch[1], 3600)
    } else {
      signedAvatarUrl = avatarUrl
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
      insertionPrompt = 'Replace the character in the scene with the character from the photo with the white background. Match the pose, position, and body orientation of the existing character in the scene. The character in the final image must have the face, hair, skin tone, and all physical features from the character in the white background photo. Dress the child in the complete outfit shown in the third image, including shoes, footwear and any accessories or none if there are none in the attire photo. Keep the background, lighting, art style, and all other elements of the scene completely unchanged. It is very important that the character in the final generated image have the physical features (eyes, hair and skintone in particular) as the character in the white background photo and be dressed in the attire shown in the third photo.'
    } else {
      insertionPrompt = 'Replace the character in the scene with the character from the photo with the white background. Match the pose, position, and body orientation of the existing character in the scene. The character in the final image must have the face, hair, skin tone, and all physical features from the character in the white background photo. Dress the child in the complete outfit shown in white background photo, including shoes and footwear. Keep the background, lighting, art style, and all other elements of the scene completely unchanged. It is very important that the character in the final generated image have the physical features (eyes, hair and skintone in particular) as the character in the white background photo.'
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

      // Build reference images: image1=scene, image2=character avatar, image3=attire (optional)
      const referenceImages = [basePhotoUrl, signedAvatarUrl]
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

