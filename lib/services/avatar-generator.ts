/**
 * Avatar generation service
 * Generates a realistic full-body character avatar at upload time using Replicate (FLUX.2 Pro).
 * The avatar preserves the child's real appearance (face, hair, clothing, accessories).
 * Art style (cartoon, storybook, comic, natural) is applied at scene generation time.
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { buildModelInput, createProviderPrediction, pollProviderPrediction } from './image-generation'
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/supabase/storage'

const AVATAR_PROMPT =
  'Create a full-length hyper-realistic digital portrait of the person in the provided photo standing upright, forward facing, on a plain white background. Maintain the same facial features, hair color, hair style, skin tone, clothing, accessories, and shoes/footwear from the photo. Use a natural, lifelike rendering style with soft studio lighting. If the photo only shows the upper body, infer appropriate clothing and footwear for the lower body that matches the visible outfit. It is very important that the generated portrait has the exact physical features - hair style, hair color, eyes, eye color, skin tone, height, weight and other attributes as the person in the photo.'

/**
 * Generate a realistic full-body avatar for a character.
 * Called in the background via waitUntil after character creation.
 * Scene generation applies art style modifiers (cartoon, storybook, etc.) at render time.
 */
export async function generateAvatars(
  characterId: string,
  userId: string,
  photoUrl: string,
): Promise<void> {
  console.log(`[AVATAR] Starting avatar generation for character ${characterId}`)

  // Update status to generating
  await supabaseAdmin
    .from('characters')
    .update({ avatar_status: 'generating' })
    .eq('id', characterId)

  // Get a signed URL for the photo (needed for Replicate to fetch it)
  let signedPhotoUrl = photoUrl
  const photoMatch = photoUrl.match(/character-photos\/(.+?)(\?|$)/)
  if (photoMatch) {
    signedPhotoUrl = await getSignedUrl('character-photos', photoMatch[1], 3600)
  }

  const MAX_ATTEMPTS = 3

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[AVATAR] Generating realistic avatar for character ${characterId} (attempt ${attempt}/${MAX_ATTEMPTS})`)
      const startTime = Date.now()

      const modelIdentifier = process.env.IMAGE_MODEL_VERSION || 'black-forest-labs/flux-2-pro'
      const predictionId = await createProviderPrediction(
        modelIdentifier,
        buildModelInput(modelIdentifier, AVATAR_PROMPT, [signedPhotoUrl], '1:1')
      )

      const generatedImageUrl = await pollProviderPrediction(predictionId)

      // Download and upload to Supabase Storage
      const imageResponse = await fetch(generatedImageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download avatar image: ${imageResponse.status}`)
      }
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

      const storagePath = `${userId}/${characterId}/avatar-cartoon.jpg`
      const avatarUrl = await uploadToStorage(
        'character-photos',
        storagePath,
        imageBuffer,
        'image/jpeg',
      )

      console.log(`[AVATAR] Realistic avatar generated in ${Date.now() - startTime}ms (attempt ${attempt}): ${avatarUrl}`)

      await supabaseAdmin
        .from('characters')
        .update({
          avatar_status: 'ready',
          avatar_cartoon_url: avatarUrl,
          avatar_error: null,
        })
        .eq('id', characterId)

      // Delete the original photo now that we have an illustrated avatar
      if (photoMatch) {
        await deleteFromStorage('character-photos', photoMatch[1]).catch((err) => {
          console.warn(`[AVATAR] Failed to delete original photo: ${err.message}`)
        })
      }

      console.log(`[AVATAR] Avatar generation complete for character ${characterId}`)
      return // Success — exit the retry loop
    } catch (error: any) {
      console.error(`[AVATAR] Avatar generation attempt ${attempt}/${MAX_ATTEMPTS} failed for character ${characterId}:`, error)

      if (attempt < MAX_ATTEMPTS) {
        // Exponential backoff: 2s, 4s
        const delayMs = Math.pow(2, attempt) * 1000
        console.log(`[AVATAR] Retrying in ${delayMs}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      } else {
        // All attempts exhausted — mark as failed, keep original photo
        await supabaseAdmin
          .from('characters')
          .update({
            avatar_status: 'failed',
            avatar_error: error.message?.substring(0, 500) || 'Unknown error',
          })
          .eq('id', characterId)
      }
    }
  }
}
