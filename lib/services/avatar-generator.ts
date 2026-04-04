/**
 * Avatar generation service
 * Generates a single illustrated character avatar (cartoon style) at upload time
 * using Google Gemini API. The style modifier during scene generation handles
 * converting to storybook/comic styles as needed.
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithGemini } from './gemini-image'
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/supabase/storage'

const AVATAR_PROMPT =
  'convert this portrait into a full-length illustrated character in Pixar-style 3D animation. maintain the same facial features, hair color, hair style, and clothing from the original portrait. critically important: preserve the exact skin tone and complexion from the original photo — do not lighten, darken, or shift the skin color in any way. standing upright, forward facing, white background.'

/**
 * Generate cartoon avatar for a character.
 * Called in the background via waitUntil after character creation.
 * Only generates one avatar (cartoon) — scene generation applies style modifiers.
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
    console.log(`[AVATAR] Generating cartoon avatar for character ${characterId}`)
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

    console.log(`[AVATAR] Cartoon avatar generated in ${Date.now() - startTime}ms: ${avatarUrl}`)

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
