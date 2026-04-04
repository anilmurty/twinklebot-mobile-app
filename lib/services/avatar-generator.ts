/**
 * Avatar generation service
 * Generates a realistic full-body character avatar at upload time using Google Gemini API.
 * The avatar preserves the child's real appearance (face, hair, clothing, accessories).
 * Art style (cartoon, storybook, comic, natural) is applied at scene generation time.
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithGemini } from './gemini-image'
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/supabase/storage'

const AVATAR_PROMPT =
  'generate a full-length photo of this person standing upright, forward facing, on a plain white background. maintain the same facial features, hair color, hair style, skin tone, clothing, accessories, and shoes/footwear from the original portrait. the result should look like a real photograph, not illustrated or cartoon. if the original photo only shows the upper body, infer appropriate clothing and footwear for the lower body that matches the visible outfit.'

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

  // Get a signed URL for the photo (needed for Gemini to fetch it)
  let signedPhotoUrl = photoUrl
  const photoMatch = photoUrl.match(/character-photos\/(.+?)(\?|$)/)
  if (photoMatch) {
    signedPhotoUrl = await getSignedUrl('character-photos', photoMatch[1], 3600)
  }

  try {
    console.log(`[AVATAR] Generating realistic avatar for character ${characterId}`)
    const startTime = Date.now()

    const imageBuffer = await generateImageWithGemini(
      AVATAR_PROMPT,
      [signedPhotoUrl],
      '1:1',
    )

    // Upload to storage
    const storagePath = `${userId}/${characterId}/avatar-cartoon.jpg`
    const avatarUrl = await uploadToStorage(
      'character-photos',
      storagePath,
      imageBuffer,
      'image/jpeg',
    )

    console.log(`[AVATAR] Realistic avatar generated in ${Date.now() - startTime}ms: ${avatarUrl}`)

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
  } catch (error: any) {
    console.error(`[AVATAR] Avatar generation failed for character ${characterId}:`, error)

    // Mark as failed, keep original photo
    await supabaseAdmin
      .from('characters')
      .update({
        avatar_status: 'failed',
        avatar_error: error.message?.substring(0, 500) || 'Unknown error',
      })
      .eq('id', characterId)
  }
}
