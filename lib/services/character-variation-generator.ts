/**
 * Character variation generation service
 * Generates front/left/right variations of a character for a specific story template
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithNanoBanana } from './image-generation'
import { uploadToStorage, getSignedUrl, deleteFromStorage } from '@/lib/supabase/storage'

export interface CharacterVariations {
  front_variation_url: string
  left_variation_url: string
  right_variation_url: string
}

/**
 * Get existing character variations for a character-template combination
 */
export async function getCharacterVariations(
  characterId: string,
  templateId: number
): Promise<CharacterVariations | null> {
  const { data, error } = await supabaseAdmin
    .from('character_variations')
    .select('front_variation_url, left_variation_url, right_variation_url')
    .eq('character_id', characterId)
    .eq('template_id', templateId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    front_variation_url: data.front_variation_url,
    left_variation_url: data.left_variation_url,
    right_variation_url: data.right_variation_url,
  }
}

/**
 * Generate character variations (front, left, right) for a character-template combination
 */
export async function generateCharacterVariations(
  characterId: string,
  templateId: number,
  basePhotoUrl: string,
  userId: string
): Promise<CharacterVariations> {
  // Check if variations already exist
  const existing = await getCharacterVariations(characterId, templateId)
  if (existing) {
    console.log(`Character variations already exist for character ${characterId} and template ${templateId}`)
    return existing
  }

  console.log(`Generating character variations for character ${characterId} and template ${templateId}`)

  // Extract storage path from URL
  const getPhotoPath = (url: string) => {
    if (!url || url.trim() === '') {
      throw new Error('Character photo URL is missing')
    }
    const match = url.match(/character-photos\/(.+)$/)
    if (match) {
      return match[1]
    }
    return `${userId}/${characterId}/front.jpg`
  }

  const basePhotoPath = getPhotoPath(basePhotoUrl)
  const signedBasePhotoUrl = await getSignedUrl('character-photos', basePhotoPath, 3600)

  // Generate three variations with prompts for different views
  const variationPrompts = {
    front: 'Generate a clear front-facing view of this child character, maintaining their exact facial features, hair color, skin tone, and expression. The character should be facing forward, standing naturally.',
    left: 'Generate a clear left-facing view (profile from left side) of this child character, maintaining their exact facial features, hair color, skin tone, and expression. The character should be turned to show their left profile.',
    right: 'Generate a clear right-facing view (profile from right side) of this child character, maintaining their exact facial features, hair color, skin tone, and expression. The character should be turned to show their right profile.',
  }

  // Generate all three variations in parallel
  const [frontUrl, leftUrl, rightUrl] = await Promise.all([
    generateImageWithNanoBanana(
      variationPrompts.front,
      [signedBasePhotoUrl],
      'match_input_image'
    ),
    generateImageWithNanoBanana(
      variationPrompts.left,
      [signedBasePhotoUrl],
      'match_input_image'
    ),
    generateImageWithNanoBanana(
      variationPrompts.right,
      [signedBasePhotoUrl],
      'match_input_image'
    ),
  ])

  // Download and upload each variation to Supabase Storage
  const storagePath = `${userId}/${characterId}/${templateId}`

  const [frontBuffer, leftBuffer, rightBuffer] = await Promise.all([
    fetch(frontUrl).then((r) => r.arrayBuffer()),
    fetch(leftUrl).then((r) => r.arrayBuffer()),
    fetch(rightUrl).then((r) => r.arrayBuffer()),
  ])

  const [frontVariationUrl, leftVariationUrl, rightVariationUrl] = await Promise.all([
    uploadToStorage('character-variations', `${storagePath}/front.jpg`, frontBuffer, 'image/jpeg'),
    uploadToStorage('character-variations', `${storagePath}/left.jpg`, leftBuffer, 'image/jpeg'),
    uploadToStorage('character-variations', `${storagePath}/right.jpg`, rightBuffer, 'image/jpeg'),
  ])

  // Store in database
  const { error: insertError } = await supabaseAdmin
    .from('character_variations')
    .insert({
      character_id: characterId,
      template_id: templateId,
      front_variation_url: frontVariationUrl,
      left_variation_url: leftVariationUrl,
      right_variation_url: rightVariationUrl,
    })

  if (insertError) {
    // Clean up uploaded files if DB insert fails
    await Promise.all([
      deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {}),
      deleteFromStorage('character-variations', `${storagePath}/left.jpg`).catch(() => {}),
      deleteFromStorage('character-variations', `${storagePath}/right.jpg`).catch(() => {}),
    ])
    throw new Error(`Failed to save character variations: ${insertError.message}`)
  }

  console.log(`Successfully generated and stored character variations for character ${characterId}`)

  return {
    front_variation_url: frontVariationUrl,
    left_variation_url: leftVariationUrl,
    right_variation_url: rightVariationUrl,
  }
}

/**
 * Delete character variations for a character-template combination
 */
export async function deleteCharacterVariations(
  characterId: string,
  templateId: number,
  userId: string
): Promise<void> {
  // Get the variations to get storage paths
  const variations = await getCharacterVariations(characterId, templateId)
  if (!variations) {
    return // Nothing to delete
  }

  // Extract storage paths from URLs
  const getStoragePath = (url: string) => {
    const match = url.match(/character-variations\/(.+)$/)
    if (match) {
      return match[1]
    }
    return null
  }

  const storagePath = `${userId}/${characterId}/${templateId}`

  // Delete from storage
  await Promise.all([
    deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {}),
    deleteFromStorage('character-variations', `${storagePath}/left.jpg`).catch(() => {}),
    deleteFromStorage('character-variations', `${storagePath}/right.jpg`).catch(() => {}),
  ])

  // Delete from database
  await supabaseAdmin
    .from('character_variations')
    .delete()
    .eq('character_id', characterId)
    .eq('template_id', templateId)

  console.log(`Deleted character variations for character ${characterId} and template ${templateId}`)
}

