/**
 * Storybook generation service
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithBasePhotoAndCharacter } from './image-generation'
import { generateImageWithGemini, isGeminiAvailable } from './gemini-image'
import { uploadToStorage } from '@/lib/supabase/storage'
import {
  getCharacterVariations,
  generateCharacterVariations,
} from './character-variation-generator'

type StorybookStyle = 'storybook' | 'comic-book' | 'cartoon'

const STYLE_MODIFIERS: Record<StorybookStyle, string> = {
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
  base_photo: string // filename from Supabase Storage (story-template-assets/day-at-the-zoo/)
  child_photo: 'front' | 'left' | 'right' | 'original' // which photo to use ('original' = child's uploaded photo)
  insertion_prompt: string // scene-specific insertion instructions
  aspect_ratio?: string
}

/**
 * Refund 1 story credit to the user when generation fails.
 * Uses the storybook's quality_tier and payment_status to determine
 * which credit pool to refund to, and only refunds if payment was completed.
 */
async function refundCreditOnFailure(storybookId: string): Promise<void> {
  try {
    const { data: storybook } = await supabaseAdmin
      .from('storybooks')
      .select('user_id, quality_tier, payment_status')
      .eq('id', storybookId)
      .single()

    if (!storybook || storybook.payment_status !== 'completed') {
      console.log(`[REFUND] No refund needed for storybook ${storybookId} (payment_status: ${storybook?.payment_status})`)
      return
    }

    const creditColumn = storybook.quality_tier === 'premium' ? 'premium_credits' : 'basic_credits'

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select(creditColumn)
      .eq('id', storybook.user_id)
      .single()

    if (!profile) {
      console.error(`[REFUND] Profile not found for user ${storybook.user_id}`)
      return
    }

    const currentCredits = (profile as any)[creditColumn] || 0
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        [creditColumn]: currentCredits + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybook.user_id)

    if (updateError) {
      console.error(`[REFUND] Failed to refund credit:`, updateError)
    } else {
      console.log(`[REFUND] Refunded 1 ${storybook.quality_tier || 'basic'} credit to user ${storybook.user_id} (now ${currentCredits + 1})`)
    }

    // Mark storybook so we don't double-refund
    await supabaseAdmin
      .from('storybooks')
      .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', storybookId)
  } catch (err: any) {
    console.error(`[REFUND] Error refunding credit for storybook ${storybookId}:`, err.message)
  }
}

export async function generateStorybook(storybookId: string): Promise<void> {
  const startTime = Date.now()
  console.log(`[TIMING] Storybook generation started at ${new Date().toISOString()}`)
  
  // Get storybook with related data
  const fetchStart = Date.now()
  const { data: storybook, error: sbError } = await supabaseAdmin
    .from('storybooks')
    .select(`
      *,
      character:characters(*),
      template:story_templates(*)
    `)
    .eq('id', storybookId)
    .single()
  console.log(`[TIMING] Fetched storybook data: ${Date.now() - fetchStart}ms`)

  if (sbError || !storybook) {
    throw new Error(`Storybook not found: ${storybookId}`)
  }

  // Check if already completed
  if (storybook.status === 'completed') {
    console.log(`Storybook ${storybookId} already completed, skipping`)
    return
  }

  // Check if resuming from preview_pending or retrying a stuck 'generating' storybook
  const isResumingFromPreview = storybook.status === 'preview_pending'
  const isRetryingStuck = storybook.status === 'generating'
  const existingScenes = Array.isArray(storybook.scenes) ? storybook.scenes : []
  const hasPreviewScene = existingScenes.length > 0 && existingScenes[0]?.image_url

  // Atomically set status to 'generating' only if it hasn't changed since we read it
  // This prevents race conditions where multiple callers try to start generation simultaneously
  // For 'generating' status (stuck retry), we allow it through since cron already filtered by time
  const statusUpdateStart = Date.now()
  const { data: updateResult, error: statusError } = await supabaseAdmin
    .from('storybooks')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', storybookId)
    .eq('status', storybook.status) // Only update if status hasn't changed
    .select('id')

  if (statusError || !updateResult || updateResult.length === 0) {
    console.log(`Storybook ${storybookId} status changed by another process, skipping duplicate generation`)
    return
  }
  console.log(`[TIMING] Updated status to generating: ${Date.now() - statusUpdateStart}ms`)

  if (isRetryingStuck) {
    console.log(`[RETRY] Resuming stuck storybook ${storybookId} - ${existingScenes.filter((s: any) => s.image_url).length} scenes already completed`)
  }

  if (isResumingFromPreview) {
    console.log(`[RESUME] Resuming generation from preview state`)
    console.log(`[RESUME] Preview scene exists: ${hasPreviewScene}`)
  }

  const character = storybook.character
  const template = storybook.template

  if (!character || !template) {
    throw new Error('Missing character or template data')
  }

    // Read quality tier from storybook (set during payment)
    const qualityTier = (storybook.quality_tier as 'basic' | 'premium') || 'basic'
    console.log(`[QUALITY] Using quality tier: ${qualityTier}`)

    // Read style and look up modifier
    const storybookStyle = ((storybook.style as StorybookStyle) || 'cartoon') as StorybookStyle
    const styleModifier = STYLE_MODIFIERS[storybookStyle] || ''
    console.log(`[STYLE] Using style: ${storybookStyle}${styleModifier ? ' (modifier applied)' : ' (no modifier)'}`)

    const userId = storybook.user_id
    const scenes = template.script_data.scenes as SceneTemplate[]
    const totalScenes = scenes.length
    
    console.log(`\n=== STORYBOOK GENERATION START ===`)
    console.log(`Storybook ID: ${storybookId}`)
    console.log(`Character: ${character.name}`)
    console.log(`Template: ${template.title}`)
    console.log(`Total scenes expected: ${totalScenes}`)
    console.log(`Scene numbers:`, scenes.map(s => s.scene_number).sort((a, b) => a - b))
    if (isResumingFromPreview) {
      console.log(`[RESUME] Resuming from preview - will skip first scene if already generated`)
    }

  try {
    // Get pre-generated avatar for this style (generated at upload time)
    console.log(`\n=== CHECKING CHARACTER AVATAR ===`)
    console.log(`Character ID: ${character.id}`)
    console.log(`Style: ${storybookStyle}`)

    // Always use cartoon avatar — scene generation applies style modifier
    const { data: charData } = await supabaseAdmin
      .from('characters')
      .select('avatar_status, avatar_cartoon_url')
      .eq('id', character.id)
      .single()

    const avatarUrl = charData?.avatar_cartoon_url as string | null

    // Build a variations-compatible object using the avatar URL
    let variations: { front_variation_url: string; left_variation_url: string; right_variation_url: string }

    if (avatarUrl && charData?.avatar_status === 'ready') {
      console.log(`✅ Using pre-generated ${storybookStyle} avatar: ${avatarUrl}`)
      variations = {
        front_variation_url: avatarUrl,
        left_variation_url: avatarUrl,
        right_variation_url: avatarUrl,
      }
      // Avatar already exists, set progress to 100%
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 100, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    } else if (charData?.avatar_status === 'generating') {
      // Avatar is still being generated — fail gracefully
      throw new Error('Character avatar is still being generated. Please wait and try again.')
    } else {
      // No avatar yet (legacy character or failed generation) — fall back to old flow
      console.log(`⚠️ No pre-generated avatar found (status: ${charData?.avatar_status}). Falling back to character variation generation.`)
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
    console.log('=====================================\n')

    // Initialize scenes array - use existing scenes if resuming from preview
    let generatedScenes = isResumingFromPreview && hasPreviewScene
      ? existingScenes
      : Array.isArray(storybook.scenes) ? storybook.scenes : []

    // If resuming from preview, we've already done character variations and first scene
    // Set progress accordingly
    const initialProgress = isResumingFromPreview && hasPreviewScene ? 110 : 110
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: initialProgress, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    // If resuming from preview, skip first scene generation (unless premium needs regeneration)
    let scenesToGenerate = isResumingFromPreview && hasPreviewScene
      ? scenes.filter(s => s.scene_number !== existingScenes[0]?.scene_number)
      : scenes

    // PREMIUM REGENERATION: If premium tier and resuming from preview,
    // regenerate scene 1 with the pro model (preview was generated with basic model)
    if (qualityTier === 'premium' && isResumingFromPreview && hasPreviewScene) {
      const previewSceneNumber = existingScenes[0]?.scene_number
      console.log(`[PREMIUM] Premium tier detected - will regenerate scene ${previewSceneNumber} with pro model`)
      // Include the preview scene in scenesToGenerate so it gets regenerated
      scenesToGenerate = scenes
    }

    // Helper function to check if scene already exists in database
    const checkSceneExists = async (sceneNumber: number): Promise<boolean> => {
      const { data: currentStorybook } = await supabaseAdmin
        .from('storybooks')
        .select('scenes')
        .eq('id', storybookId)
        .single()

      const currentScenes = Array.isArray(currentStorybook?.scenes) ? currentStorybook.scenes : []
      const existingScene = currentScenes.find((s: any) => s.scene_number === sceneNumber)
      const exists = !!existingScene?.image_url
      
      if (exists) {
        console.log(`Scene ${sceneNumber} already exists in database with image_url`)
      }
      
      return exists
    }

    // Track whether scene 1 is being regenerated for premium (to skip existence check)
    const premiumRegenerateSceneNumber = (qualityTier === 'premium' && isResumingFromPreview && hasPreviewScene)
      ? existingScenes[0]?.scene_number
      : null

    // Helper function to generate a single scene (first attempt only - no retries)
    const generateSceneFirstAttempt = async (sceneTemplate: SceneTemplate): Promise<void> => {
      // Check database first to avoid duplicate predictions
      // Skip this check for the premium regeneration scene
      if (sceneTemplate.scene_number !== premiumRegenerateSceneNumber) {
        const alreadyExists = await checkSceneExists(sceneTemplate.scene_number)
        if (alreadyExists) {
          console.log(`Scene ${sceneTemplate.scene_number} already generated in database, skipping`)
          return
        }
      } else {
        console.log(`[PREMIUM] Regenerating scene ${sceneTemplate.scene_number} with premium model`)
      }

      console.log(`Generating scene ${sceneTemplate.scene_number} (first attempt)`)

      // Validate required fields
      if (!sceneTemplate.base_photo || sceneTemplate.base_photo.trim() === '') {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing base_photo field`)
      }
      if (!sceneTemplate.child_photo || !['front', 'left', 'right', 'original'].includes(sceneTemplate.child_photo)) {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing or invalid child_photo field`)
      }
      if (!sceneTemplate.insertion_prompt || sceneTemplate.insertion_prompt.trim() === '') {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing insertion_prompt field`)
      }

      const { getSignedUrl } = await import('@/lib/supabase/storage')
      let characterImageUrl: string

      if (sceneTemplate.child_photo === 'original') {
        // Use the child's original uploaded photo (not the character variation)
        const originalPhotoUrl = character.front_photo_url
        if (!originalPhotoUrl) {
          throw new Error(`Character original photo URL not found`)
        }

        // Extract storage path and create signed URL
        const match = originalPhotoUrl.match(/character-photos\/(.+)$/)
        if (match) {
          characterImageUrl = await getSignedUrl('character-photos', match[1], 3600)
        } else {
          // Already a full/signed URL
          characterImageUrl = originalPhotoUrl
        }
        console.log(`Scene ${sceneTemplate.scene_number}: using child's original photo`)
      } else {
        // Use the character variation (front/left/right)
        let characterVariationUrl = variations.front_variation_url

        if (!characterVariationUrl) {
          throw new Error(`Character variation URL not found`)
        }

        // Extract bucket and path from URL (supports character-photos and character-variations)
        let variationBucket = 'character-variations'
        let variationStoragePath: string | null = null
        for (const bucket of ['character-photos', 'character-variations']) {
          const match = characterVariationUrl.match(new RegExp(`/${bucket}/(.+)$`))
          if (match) {
            variationBucket = bucket
            variationStoragePath = match[1]
            break
          }
        }
        if (!variationStoragePath) {
          throw new Error(`Could not extract storage path from character variation URL: ${characterVariationUrl}`)
        }

        characterImageUrl = await getSignedUrl(variationBucket, variationStoragePath, 3600)
      }

      // Construct base photo path - extract folder from template thumbnail_url
      // thumbnail_url format: "/counting-general/cover.png" -> folder is "counting-general"
      let basePhotoPath: string
      if (template.thumbnail_url && template.thumbnail_url.includes('/')) {
        const thumbnailParts = template.thumbnail_url.split('/')
        if (thumbnailParts.length >= 2) {
          const folder = thumbnailParts[1] // Extract folder name (e.g., "counting-general" or "day-at-the-zoo")
          basePhotoPath = `/${folder}/${sceneTemplate.base_photo}`
        } else {
          // Fallback: hardcode for "Day at the Zoo" template
          basePhotoPath = `/day-at-the-zoo/${sceneTemplate.base_photo}`
        }
      } else {
        // Fallback: hardcode for "Day at the Zoo" template
        basePhotoPath = `/day-at-the-zoo/${sceneTemplate.base_photo}`
      }

      console.log(`\n=== SCENE ${sceneTemplate.scene_number} GENERATION ===`)
      console.log(`Character: ${character.name}`)
      console.log(`Base photo path: ${basePhotoPath}`)
      console.log(`Character variation type: ${sceneTemplate.child_photo}`)
      console.log(`\n--- INSERTION PROMPT ---`)
      console.log(sceneTemplate.insertion_prompt)
      console.log(`\n--- END INSERTION PROMPT ---`)
      console.log('=====================================\n')

      // Double-check database right before creating prediction to avoid race conditions
      // Skip this check for the premium regeneration scene
      if (sceneTemplate.scene_number !== premiumRegenerateSceneNumber) {
        const stillNeeded = !(await checkSceneExists(sceneTemplate.scene_number))
        if (!stillNeeded) {
          console.log(`Scene ${sceneTemplate.scene_number} was completed by another process, skipping`)
          return
        }
      }

      // Build Gemini-safe insertion prompt (no age/gender references)
      // The template's insertion_prompt may contain old-style language, so we use a generic safe prompt
      // and append the style modifier
      const safeInsertionPrompt = 'place the illustrated character from the second image into the scene from the first image, matching the pose and position of the existing character in the scene. maintain the character\'s facial features, hair, skin tone, and clothing. the result should look like the character was always part of this scene.'
      const styledInsertionPrompt = styleModifier
        ? `${safeInsertionPrompt} ${styleModifier}`
        : safeInsertionPrompt

      console.log(`[STYLE] Using Gemini-safe prompt with ${storybookStyle} modifier for scene ${sceneTemplate.scene_number}`)

      // Generate scene image
      let storedImageUrl: string

      if (isGeminiAvailable()) {
        // Use Google Gemini API — synchronous, no polling needed
        const { getStorageUrl } = await import('@/lib/supabase/storage')
        const basePhotoStoragePath = basePhotoPath.startsWith('/') ? basePhotoPath.slice(1) : basePhotoPath
        const basePhotoUrl = getStorageUrl('story-template-assets', basePhotoStoragePath)

        console.log(`[GEMINI] Generating scene ${sceneTemplate.scene_number}`)
        const imageBuffer = await generateImageWithGemini(
          styledInsertionPrompt,
          [basePhotoUrl, characterImageUrl],
          sceneTemplate.aspect_ratio || '9:16'
        )

        // Upload buffer directly to Supabase Storage
        const { uploadToStorage } = await import('@/lib/supabase/storage')
        console.log(`Uploading scene ${sceneTemplate.scene_number} image to storage...`)
        storedImageUrl = await uploadToStorage(
          'storybook-scenes',
          `${storybookId}/scene-${sceneTemplate.scene_number}.jpg`,
          imageBuffer,
          'image/jpeg'
        )
      } else {
        // Fallback: use Replicate
        console.warn('[FALLBACK] Using Replicate for scene generation')
        const { createBasePhotoAndCharacterPrediction, pollPrediction } = await import('./image-generation')
        const predictionId = await createBasePhotoAndCharacterPrediction(
          basePhotoPath,
          characterImageUrl,
          styledInsertionPrompt,
          sceneTemplate.aspect_ratio || '9:16',
          template.id,
          qualityTier
        )

        const generatedImageUrl = await pollPrediction(predictionId)
        console.log(`Scene ${sceneTemplate.scene_number} generated successfully:`, generatedImageUrl)

        const imageResponse = await fetch(generatedImageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`)
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        const { uploadToStorage } = await import('@/lib/supabase/storage')
        console.log(`Uploading scene ${sceneTemplate.scene_number} image to storage...`)
        storedImageUrl = await uploadToStorage(
          'storybook-scenes',
          `${storybookId}/scene-${sceneTemplate.scene_number}.jpg`,
          imageBuffer,
          'image/jpeg'
        )
      }

      console.log(`✅ Scene ${sceneTemplate.scene_number} image uploaded to storage: ${storedImageUrl}`)

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
      
      console.log(`Scene ${sceneTemplate.scene_number} data prepared:`, {
        scene_number: sceneData.scene_number,
        headline: sceneData.headline,
        image_url: sceneData.image_url,
        has_text: !!sceneData.text,
      })

      // Update storybook scenes array atomically with retry logic to handle race conditions
      // When scenes are generated in parallel, multiple scenes might try to update the array simultaneously
      // We use updated_at as an optimistic lock: only update if the row hasn't changed since we read it
      let updateSuccess = false
      let updateAttempts = 0
      const maxUpdateAttempts = 8

      while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
        updateAttempts++

        // Fetch current scenes AND updated_at as version marker
        const { data: currentStorybook, error: fetchError } = await supabaseAdmin
          .from('storybooks')
          .select('scenes, updated_at')
          .eq('id', storybookId)
          .single()

        if (fetchError) {
          console.error(`Failed to fetch scenes for update (attempt ${updateAttempts}):`, fetchError)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, updateAttempts - 1)))
            continue
          } else {
            throw new Error(`Failed to fetch scenes after ${maxUpdateAttempts} attempts: ${fetchError.message}`)
          }
        }

        const currentScenes = Array.isArray(currentStorybook?.scenes) ? currentStorybook.scenes : []
        const rowVersion = currentStorybook?.updated_at

        // Check if scene already exists (another process might have added it)
        const existingIndex = currentScenes.findIndex(
          (s: any) => s.scene_number === sceneTemplate.scene_number
        )

        if (existingIndex >= 0 && currentScenes[existingIndex]?.image_url) {
          // Scene already exists with image, skip update
          console.log(`Scene ${sceneTemplate.scene_number} already exists in database, skipping update`)
          updateSuccess = true
          break
        }

        // Prepare updated scenes array — merge our scene into the current array
        const updatedScenes = [...currentScenes]
        if (existingIndex >= 0) {
          updatedScenes[existingIndex] = sceneData
        } else {
          updatedScenes.push(sceneData)
        }

        // Sort scenes by scene_number to ensure correct order
        updatedScenes.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))

        const newTimestamp = new Date().toISOString()

        // Optimistic lock: only update if updated_at hasn't changed since we read it
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('storybooks')
          .update({
            scenes: updatedScenes,
            updated_at: newTimestamp,
          })
          .eq('id', storybookId)
          .eq('updated_at', rowVersion) // optimistic lock
          .select('scenes')

        if (updateError) {
          console.error(`❌ Failed to update scenes (attempt ${updateAttempts}):`, updateError)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150 * updateAttempts))
            continue
          } else {
            throw new Error(`Failed to update scenes after ${maxUpdateAttempts} attempts: ${updateError.message}`)
          }
        }

        // If no rows matched the optimistic lock, another process updated first — retry
        if (!updateData || updateData.length === 0) {
          console.log(`Scene ${sceneTemplate.scene_number}: optimistic lock miss (attempt ${updateAttempts}/${maxUpdateAttempts}), retrying...`)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150 * updateAttempts))
            continue
          }
        } else {
          // Update succeeded — verify our scene is present
          const savedScenes = Array.isArray(updateData[0]?.scenes) ? updateData[0].scenes : []
          const savedScene = savedScenes.find((s: any) => s.scene_number === sceneTemplate.scene_number)

          if (savedScene?.image_url) {
            updateSuccess = true
            generatedScenes = savedScenes
            console.log(`✅ Scene ${sceneTemplate.scene_number} saved (attempt ${updateAttempts}, ${savedScenes.length} total scenes)`)
            // Update progress monotonically
            const completedCount = savedScenes.filter((s: any) => s.image_url).length
            const newProgress = 100 + Math.round(10 + (completedCount / totalScenes) * 90)
            await supabaseAdmin
              .from('storybooks')
              .update({ progress: newProgress, updated_at: new Date().toISOString() })
              .eq('id', storybookId)
              .lt('progress', newProgress)
          } else {
            console.log(`Scene ${sceneTemplate.scene_number}: not found after update, retrying (attempt ${updateAttempts})...`)
            if (updateAttempts < maxUpdateAttempts) {
              await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150 * updateAttempts))
            }
          }
        }
      }

      if (!updateSuccess) {
        throw new Error(`Failed to update scene ${sceneTemplate.scene_number} after ${maxUpdateAttempts} attempts due to race conditions`)
      }
    }

    // Helper function to retry a failed scene generation (sequential, not parallel)
    const retrySceneGeneration = async (sceneTemplate: SceneTemplate, attempt: number): Promise<void> => {
      console.log(`Retrying scene ${sceneTemplate.scene_number} (attempt ${attempt}/3)`)
      
      // Exponential backoff before retry
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000))
      
      try {
        // Re-run the generation logic
        await generateSceneFirstAttempt(sceneTemplate)
      } catch (error: any) {
        console.error(`Scene ${sceneTemplate.scene_number} retry attempt ${attempt} failed:`, error.message)
        
        if (attempt < 3) {
          // Try again
          return retrySceneGeneration(sceneTemplate, attempt + 1)
        } else {
          // All retries failed
          throw new Error(`Failed to generate scene ${sceneTemplate.scene_number} after 3 attempts: ${error.message}`)
        }
      }
    }

    // Generate scenes (throttled for Gemini rate limits, or fully parallel for Replicate)
    const useGemini = isGeminiAvailable()
    console.log(`\n=== STARTING SCENE GENERATION (FIRST ATTEMPT) ===`)
    console.log(`Generating ${scenesToGenerate.length} scenes ${useGemini ? 'with Gemini (concurrency: 2)' : 'in parallel via Replicate'}...`)
    if (isResumingFromPreview && hasPreviewScene) {
      console.log(`[RESUME] Skipping preview scene (scene ${existingScenes[0]?.scene_number})`)
    }

    let results: PromiseSettledResult<void>[]
    if (useGemini) {
      // Throttle to concurrency 2 to stay under Gemini's 10 IPM rate limit
      const pLimit = (await import('p-limit')).default
      const limit = pLimit(2)
      const scenePromises = scenesToGenerate.map(sceneTemplate =>
        limit(() => generateSceneFirstAttempt(sceneTemplate))
      )
      results = await Promise.allSettled(scenePromises)
    } else {
      const scenePromises = scenesToGenerate.map(sceneTemplate => generateSceneFirstAttempt(sceneTemplate))
      results = await Promise.allSettled(scenePromises)
    }
    
    // Check for failures - only retry failed scenes sequentially
    const failures = results
      .map((result, index) => ({ 
        result, 
        sceneTemplate: scenesToGenerate[index],
        sceneNumber: scenesToGenerate[index].scene_number 
      }))
      .filter(({ result }) => result.status === 'rejected')

    // Retry failed scenes sequentially (not in parallel)
    if (failures.length > 0) {
      console.log(`\n=== RETRYING FAILED SCENES SEQUENTIALLY ===`)
      console.log(`${failures.length} scene(s) failed on first attempt, retrying sequentially...`)
      
      const retryErrors: string[] = []
      
      for (const { sceneTemplate, sceneNumber, result } of failures) {
        try {
          console.log(`\nRetrying scene ${sceneNumber}...`)
          await retrySceneGeneration(sceneTemplate, 2) // Start at attempt 2 (first was attempt 1)
          console.log(`✅ Scene ${sceneNumber} succeeded on retry`)
        } catch (retryError: any) {
          console.error(`❌ Scene ${sceneNumber} failed after all retries:`, retryError.message)
          retryErrors.push(`Scene ${sceneNumber}: ${retryError.message}`)
        }
      }
      
      if (retryErrors.length > 0) {
        const errorMessages = retryErrors.join('\n')
        await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'failed',
            error_message: `Failed to generate ${retryErrors.length} scene(s) after retries:\n${errorMessages}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)

        throw new Error(`Failed to generate ${retryErrors.length} scene(s) after retries`)
      }
    }

    // Verify all scenes exist in database before marking as complete
    // Add a small delay to ensure all database writes have completed
    console.log(`\n=== VERIFYING ALL SCENES ARE COMPLETE ===`)
    console.log(`Waiting 2 seconds for all database writes to complete...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Retry verification up to 3 times with exponential backoff
    let finalScenes: any[] = []
    let completedScenes = 0
    let verifyAttempt = 0
    const maxVerifyAttempts = 3
    
    while (verifyAttempt < maxVerifyAttempts) {
      verifyAttempt++
      console.log(`Verification attempt ${verifyAttempt}/${maxVerifyAttempts}...`)
      
      let finalStorybook: any = null
      let verifyError: any = null
      
      try {
        const result = await supabaseAdmin
          .from('storybooks')
          .select('scenes')
          .eq('id', storybookId)
          .single()
        
        finalStorybook = result.data
        verifyError = result.error
      } catch (err: any) {
        verifyError = err
        console.error(`❌ Exception verifying scenes (attempt ${verifyAttempt}):`, err)
      }

      if (verifyError) {
        console.error(`❌ Error verifying scenes (attempt ${verifyAttempt}):`, verifyError)
        console.error(`Error code: ${verifyError.code}, Error message: ${verifyError.message}`)
        if (verifyAttempt === maxVerifyAttempts) {
          // If verification fails but we know scenes exist, try to proceed anyway
          console.error(`⚠️ Verification failed after ${maxVerifyAttempts} attempts, but proceeding with final scenes from last successful fetch`)
          if (finalScenes.length === totalScenes) {
            console.log(`⚠️ Using cached scenes array (${finalScenes.length} scenes) since verification is failing`)
            break
          } else {
            throw new Error(`Failed to verify scenes after ${maxVerifyAttempts} attempts: ${verifyError.message}`)
          }
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, verifyAttempt) * 1000))
        continue
      }

      finalScenes = Array.isArray(finalStorybook?.scenes) ? finalStorybook.scenes : []
      completedScenes = finalScenes.filter((s: any) => s.image_url).length
      
      console.log(`Found ${completedScenes}/${totalScenes} completed scenes in database`)
      console.log(`Scene numbers with images:`, finalScenes.filter((s: any) => s.image_url).map((s: any) => s.scene_number).sort((a, b) => a - b))

      if (completedScenes >= totalScenes) {
        console.log(`✅ All scenes verified complete on attempt ${verifyAttempt}`)
        break
      }
      
      if (verifyAttempt < maxVerifyAttempts) {
        const missingScenes = scenes
          .map(s => s.scene_number)
          .filter(num => !finalScenes.find((s: any) => s.scene_number === num && s.image_url))
        console.log(`⚠️ Only ${completedScenes}/${totalScenes} scenes found. Missing: ${missingScenes.join(', ')}. Retrying...`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, verifyAttempt) * 1000))
      }
    }

    if (completedScenes < totalScenes) {
      const missingScenes = scenes
        .map(s => s.scene_number)
        .filter(num => !finalScenes.find((s: any) => s.scene_number === num && s.image_url))
      
      console.error(`⚠️ Warning: Only ${completedScenes}/${totalScenes} scenes completed after ${maxVerifyAttempts} verification attempts. Missing scenes: ${missingScenes.join(', ')}`)
      
      const { error: updateError } = await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'failed',
          error_message: `Only ${completedScenes}/${totalScenes} scenes generated. Missing scenes: ${missingScenes.join(', ')}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)

      if (updateError) {
        console.error(`❌ Failed to update storybook status to failed:`, updateError)
      }

      throw new Error(`Only ${completedScenes}/${totalScenes} scenes generated. Missing: ${missingScenes.join(', ')}`)
    }
    
    console.log(`✅ All ${totalScenes} scenes verified complete`)

    // Verify scene images exist in storage
    console.log(`\n=== VERIFYING SCENE IMAGES IN STORAGE ===`)
    const { supabaseAdmin: storageAdmin } = await import('@/lib/supabase/server')
    try {
      const { data: storageFiles, error: storageError } = await storageAdmin.storage
        .from('storybook-scenes')
        .list(storybookId, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (!storageError && storageFiles) {
        console.log(`Found ${storageFiles.length} scene file(s) in storage for storybook ${storybookId}`)
        const storageFileNames = storageFiles.map(f => f.name).sort()
        const expectedFileNames = finalScenes.map((s: any) => `scene-${s.scene_number}.jpg`).sort()
        console.log(`Storage files:`, storageFileNames)
        console.log(`Expected files:`, expectedFileNames)
        
        const missingFiles = expectedFileNames.filter(name => !storageFileNames.includes(name))
        if (missingFiles.length > 0) {
          console.error(`⚠️ Warning: Missing scene files in storage: ${missingFiles.join(', ')}`)
        } else {
          console.log(`✅ All scene files verified in storage`)
        }
      } else if (storageError) {
        console.error(`⚠️ Warning: Could not verify storage files:`, storageError)
      }
    } catch (err) {
      console.error(`⚠️ Warning: Error checking storage files:`, err)
    }
    console.log(`==========================================\n`)

    // Sort scenes by scene_number one final time before marking as completed
    finalScenes.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))
    
    // Validate scenes array before saving
    if (finalScenes.length !== totalScenes) {
      console.error(`❌ Scene count mismatch: Expected ${totalScenes}, found ${finalScenes.length}`)
      throw new Error(`Scene count mismatch: Expected ${totalScenes}, found ${finalScenes.length}`)
    }
    
    const sceneNumbers = finalScenes.map((s: any) => s.scene_number).sort((a, b) => a - b)
    const expectedSceneNumbers = scenes.map(s => s.scene_number).sort((a, b) => a - b)
    
    if (JSON.stringify(sceneNumbers) !== JSON.stringify(expectedSceneNumbers)) {
      console.error(`❌ Scene numbers mismatch: Expected ${JSON.stringify(expectedSceneNumbers)}, found ${JSON.stringify(sceneNumbers)}`)
      throw new Error(`Scene numbers mismatch: Expected ${expectedSceneNumbers.join(', ')}, found ${sceneNumbers.join(', ')}`)
    }
    
    // Validate all scenes have required fields
    for (const scene of finalScenes) {
      if (!scene.scene_number || !scene.image_url) {
        console.error(`❌ Invalid scene data:`, scene)
        throw new Error(`Scene ${scene.scene_number || 'unknown'} is missing required fields`)
      }
    }
    
    console.log(`✅ Scenes array validated: ${finalScenes.length} scenes, all with image_url`)
    console.log(`Scene details:`, finalScenes.map((s: any) => ({
      scene_number: s.scene_number,
      has_image_url: !!s.image_url,
      image_url_preview: s.image_url ? s.image_url.substring(0, 100) + '...' : 'MISSING',
      has_text: !!s.text,
      headline: s.headline,
    })))

    // All scenes generated successfully - mark as completed
    // Set progress to 200 (which displays as 100% in scene generation phase)
    // The UI subtracts 100 from progress >= 100 to get scene progress (0-100%)
    // So 200 - 100 = 100% completion
    // Database constraint allows 0-200 (migration 014)
    console.log(`✅ All ${totalScenes} scenes verified in database. Marking storybook as completed.`)
    console.log(`Final scenes array length: ${finalScenes.length}`)
    console.log(`Final scenes scene_numbers:`, finalScenes.map((s: any) => s.scene_number).sort((a, b) => a - b))
    
    // Retry the completion update in case of transient errors
    let completionUpdateSuccess = false
    let completionAttempts = 0
    const maxCompletionAttempts = 3
    
    while (!completionUpdateSuccess && completionAttempts < maxCompletionAttempts) {
      completionAttempts++
      console.log(`Attempting to mark storybook as completed (attempt ${completionAttempts}/${maxCompletionAttempts})...`)
      
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'completed',
          progress: 200, // Scene generation complete (displays as 100%)
          scenes: finalScenes, // Ensure scenes are sorted before final save
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)
        .select('status')

      if (updateError) {
        console.error(`❌ Failed to update storybook status to completed (attempt ${completionAttempts}):`, updateError)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Failed to mark storybook as completed after ${maxCompletionAttempts} attempts: ${updateError.message}`)
        }
      }

      // Verify the update succeeded
      const { data: verifyComplete, error: verifyError } = await supabaseAdmin
        .from('storybooks')
        .select('status')
        .eq('id', storybookId)
        .single()

      if (verifyError) {
        console.error(`❌ Error verifying completion status (attempt ${completionAttempts}):`, verifyError)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Failed to verify completion status after ${maxCompletionAttempts} attempts: ${verifyError.message}`)
        }
      }

      if (verifyComplete?.status === 'completed') {
        console.log(`✅ Storybook successfully marked as completed on attempt ${completionAttempts}`)
        completionUpdateSuccess = true
        break
      } else {
        console.error(`❌ Storybook status update verification failed. Expected 'completed', got '${verifyComplete?.status}'`)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Storybook status was not set to completed after ${maxCompletionAttempts} attempts. Current status: ${verifyComplete?.status}`)
        }
      }
    }
    
    if (!completionUpdateSuccess) {
      throw new Error(`Failed to mark storybook as completed after ${maxCompletionAttempts} attempts`)
    }

    // Update generation job status
    const { error: jobUpdateError } = await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('storybook_id', storybookId)

    if (jobUpdateError) {
      console.error(`⚠️ Warning: Failed to update generation job status:`, jobUpdateError)
      // Don't throw - storybook is already marked as completed
    }

    console.log(`✅ Storybook ${storybookId} generation completed - all ${totalScenes} scenes generated successfully`)

    // Send push notification (best-effort, never throws)
    try {
      const { sendNotificationToUser } = await import('@/lib/services/apns-service')
      await sendNotificationToUser(
        userId,
        'Your Story is Ready!',
        `${character.name}'s "${template.title}" storybook is complete!`,
        { storybookId, type: 'story_complete' }
      )
    } catch (err: any) {
      console.error('[STORYBOOK] Failed to send notification:', err.message)
    }

    // Send admin QC email with scene thumbnails (best-effort, never throws)
    try {
      const { sendStoryCompletionAlert } = await import('@/lib/services/admin-alerts')
      const { getSignedUrl } = await import('@/lib/supabase/storage')

      // Generate signed URLs for scene images (24-hour expiry for email viewing)
      const scenesWithSignedUrls = await Promise.all(
        finalScenes.map(async (s: any) => {
          let imageUrl = s.image_url
          try {
            const match = s.image_url?.match(/storybook-scenes\/(.+?)(\?|$)/)
            if (match) {
              imageUrl = await getSignedUrl('storybook-scenes', match[1], 86400)
            }
          } catch { /* keep original URL */ }
          return { scene_number: s.scene_number, headline: s.headline, image_url: imageUrl }
        })
      )

      // Get signed URL for character photo
      let charPhotoUrl = character.front_photo_url
      try {
        const charMatch = charPhotoUrl?.match(/character-photos\/(.+?)(\?|$)/)
        if (charMatch) {
          charPhotoUrl = await getSignedUrl('character-photos', charMatch[1], 86400)
        }
      } catch { /* keep original */ }

      await sendStoryCompletionAlert({
        storybookId,
        title: template.title,
        characterName: character.name,
        characterPhotoUrl: charPhotoUrl,
        style: storybookStyle,
        scenes: scenesWithSignedUrls,
      })
    } catch (err: any) {
      console.error('[STORYBOOK] Failed to send QC email:', err.message)
    }
  } catch (error: any) {
    // Ensure status is updated even if an unexpected error occurs
    console.error(`❌ Unexpected error during storybook generation:`, error)
    console.error(`Error stack:`, error.stack)
    
    // Try to update status to failed with retries
    let statusUpdateSuccess = false
    for (let retry = 0; retry < 3; retry++) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'failed',
            error_message: `Error: ${error.message || 'Unknown error'}`.substring(0, 500), // Limit error message length
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)
        
        if (!updateError) {
          statusUpdateSuccess = true
          console.log(`✅ Successfully updated storybook status to 'failed'`)
          break
        } else {
          console.error(`❌ Failed to update storybook status (attempt ${retry + 1}/3):`, updateError)
          if (retry < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)))
          }
        }
      } catch (updateErr: any) {
        console.error(`❌ Exception updating storybook status (attempt ${retry + 1}/3):`, updateErr)
        if (retry < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)))
        }
      }
    }
    
    if (!statusUpdateSuccess) {
      console.error(`❌ CRITICAL: Failed to update storybook status after 3 attempts. Storybook ${storybookId} may be stuck in 'generating' status.`)
    }

    // Refund the user's credit since generation failed
    await refundCreditOnFailure(storybookId)

    throw error // Re-throw to let caller know it failed
  }
}
