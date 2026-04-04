/**
 * Avatar generation service
 * Generates illustrated character avatars in 3 styles at upload time
 * using Google Gemini API (Nano Banana 2)
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithGemini } from './gemini-image'
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/supabase/storage'

type AvatarStyle = 'cartoon' | 'storybook' | 'comic'

const AVATAR_PROMPTS: Record<AvatarStyle, string> = {
  cartoon:
    'convert this portrait into a Pixar-style 3D animated character. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. white background, forward facing, standing upright, full length, illustrated style.',
  storybook:
    'convert this portrait into a watercolor picture book illustration character. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. soft painterly textures, warm pastel palette. white background, forward facing, standing upright, full length.',
  comic:
    'convert this portrait into a comic book art style character. bold black ink outlines, flat vivid colors. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. white background, forward facing, standing upright, full length.',
}

/**
 * Generate all 3 style avatars for a character.
 * Called in the background via waitUntil after character creation.
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

  const styles: AvatarStyle[] = ['cartoon', 'storybook', 'comic']
  const results: Record<string, string> = {}

  try {
    // Generate each style sequentially to respect Gemini rate limits
    for (const style of styles) {
      console.log(`[AVATAR] Generating ${style} avatar for character ${characterId}`)
      const startTime = Date.now()

      const imageBuffer = await generateImageWithGemini(
        AVATAR_PROMPTS[style],
        [signedPhotoUrl],
        '1:1',
      )

      // Upload to storage
      const storagePath = `${userId}/${characterId}/avatar-${style}.jpg`
      const avatarUrl = await uploadToStorage(
        'character-photos',
        storagePath,
        imageBuffer,
        'image/jpeg',
      )

      results[style] = avatarUrl
      console.log(`[AVATAR] ${style} avatar generated in ${Date.now() - startTime}ms: ${avatarUrl}`)
    }

    // All 3 succeeded — update character with avatar URLs and mark as ready
    await supabaseAdmin
      .from('characters')
      .update({
        avatar_status: 'ready',
        avatar_cartoon_url: results.cartoon,
        avatar_storybook_url: results.storybook,
        avatar_comic_url: results.comic,
        avatar_error: null,
      })
      .eq('id', characterId)

    // Delete the original photo now that we have illustrated avatars
    if (photoMatch) {
      await deleteFromStorage('character-photos', photoMatch[1]).catch((err) => {
        console.warn(`[AVATAR] Failed to delete original photo: ${err.message}`)
      })
    }

    console.log(`[AVATAR] All 3 avatars generated successfully for character ${characterId}`)
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
