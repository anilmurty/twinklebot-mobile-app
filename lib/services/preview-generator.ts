/**
 * Preview generation service
 * Generates first scene only for preview
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithBasePhotoAndCharacter } from './image-generation'
import { generateImageWithGemini, isGeminiAvailable } from './gemini-image'
import { uploadToStorage } from '@/lib/supabase/storage'
import { sendStoryFailureAlert } from './admin-alerts'

type StorybookStyle = 'natural' | 'storybook' | 'comic-book' | 'cartoon'

const STYLE_MODIFIERS: Record<StorybookStyle, string> = {
  natural: '',
  storybook:
    'render the character and transform the entire scene in a watercolor picture book illustration style, soft painterly textures, warm pastel palette, gentle visible brushstrokes, professional picture book quality, maintaining consistent style across all scene elements.',
  'comic-book':
    'render the character and transform the entire scene in comic book art style, bold black ink outlines applied consistently to all elements including background, flat vivid colors, dynamic composition, high contrast, professional comic illustration.',
  cartoon:
    'render the character and transform the entire scene in 3D animated movie style, smooth surfaces, vibrant saturated colors, soft studio lighting, Pixar-quality render, bright and cheerful, consistent style across character and background.',
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
 * Generate preview: first scene only
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
      console.log(`[PREVIEW] Using portrait`)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 50, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    } else if (charData?.avatar_status === 'generating') {
      throw new Error('Character portrait is still being generated. Please wait and try again.')
    } else {
      throw new Error('Character portrait not found. Please re-create the character.')
    }

    // Step 2: Generate first scene
    console.log(`[PREVIEW] Step 2: Generating first scene...`)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 60, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    // Get signed URL for the character portrait
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    const avatarMatch = avatarUrl.match(/character-photos\/(.+?)(\?|$)/)
    let signedVariationUrl: string
    if (avatarMatch) {
      signedVariationUrl = await getSignedUrl('character-photos', avatarMatch[1], 3600)
    } else {
      signedVariationUrl = avatarUrl
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

    // Build insertion prompt from per-scene template prompt
    // For 'original' scenes (e.g. PJ/bedroom scenes), skip attire — let the base scene dictate clothing
    const styleModifier = STYLE_MODIFIERS[storybookStyle] || ''
    const useAttire = selectedLook && !selectedLook.is_original && firstScene.child_photo !== 'original'

    // Use the scene-specific insertion_prompt from the database
    let insertionPrompt = firstScene.insertion_prompt

    // Append attire instruction if custom look is selected
    if (useAttire) {
      insertionPrompt += ' dress the character in the complete outfit shown in the third image, including shoes and footwear.'
    }

    // Always append core instructions
    insertionPrompt += ' maintain the character\'s facial features, hair, and skin tone.'

    const styledPrompt = styleModifier
      ? `${insertionPrompt} ${styleModifier}`
      : insertionPrompt

    console.log(`[PREVIEW] Using per-scene prompt with ${storybookStyle} modifier${useAttire ? ' (custom look)' : firstScene.child_photo === 'original' ? ' (original/no attire)' : ''}`)

    // Generate first scene image
    const sceneFileName = `${storybookId}/scene-${firstScene.scene_number}.jpg`
    let uploadedSceneUrl: string

    if (isGeminiAvailable()) {
      // Use Google Gemini API — no polling needed
      const { getStorageUrl } = await import('@/lib/supabase/storage')
      const basePhotoStoragePath = basePhotoPath.startsWith('/') ? basePhotoPath.slice(1) : basePhotoPath
      const basePhotoUrl = getStorageUrl('story-template-assets', basePhotoStoragePath)

      // Build reference images: base scene + character + optional attire
      const referenceImages = [basePhotoUrl, signedVariationUrl]
      if (useAttire && selectedLook.attire_image_url) {
        let attireUrl = selectedLook.attire_image_url
        if (!attireUrl.startsWith('http')) {
          const attirePath = attireUrl.startsWith('/') ? attireUrl.slice(1) : attireUrl
          attireUrl = getStorageUrl('story-template-assets', attirePath)
        }
        referenceImages.push(attireUrl)
      }

      console.log(`[PREVIEW] Using Gemini for scene generation with ${referenceImages.length} reference images`)
      const imageBuffer = await generateImageWithGemini(
        styledPrompt,
        referenceImages,
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

    // Send failure alert email (best-effort)
    try {
      const storybookStyle = ((storybook.style as StorybookStyle) || 'natural') as StorybookStyle
      await sendStoryFailureAlert({
        storybookId,
        title: template.title,
        characterName: character.name,
        style: storybookStyle,
        errorMessage: error.message || String(error),
        errorStack: error.stack,
        phase: 'preview',
        durationMs: Date.now() - previewStartTime,
      })
    } catch (alertErr: any) {
      console.error('[PREVIEW] Failed to send failure alert:', alertErr.message)
    }

    throw error
  }
}

