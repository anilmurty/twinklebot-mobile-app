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

  if (error) {
    // PGRST116 means no rows found, which is fine
    if (error.code === 'PGRST116') {
      return null
    }
    // Other errors should be logged
    console.error('Error checking for character variations:', error)
    return null
  }

  if (!data) {
    return null
  }

  // Validate that all URLs exist
  if (!data.front_variation_url || !data.left_variation_url || !data.right_variation_url) {
    console.warn('Character variations found but URLs are incomplete, will regenerate')
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
  // Front variation: Use uploaded photo, dress for zoo
  const frontPrompt = "dress this child like they're ready for a day at the zoo. safari attire, bright animal-themed sun hat, binoculars dangling, arms on either side and happy expression. keep facial features identical. white background and full length"
  
  // Left and Right variations: Use front variation as input, change facing direction
  const leftPrompt = "Change this so that the child is facing right"
  const rightPrompt = "Change this so that the child is facing left"

  // Log prompts for debugging
  console.log('\n=== CHARACTER VARIATION GENERATION ===')
  console.log(`Character ID: ${characterId}`)
  console.log(`Template ID: ${templateId}`)
  console.log(`Base photo URL: ${signedBasePhotoUrl}`)
  console.log('\n--- Front Variation Prompt ---')
  console.log(frontPrompt)
  console.log('\n--- Left Variation Prompt ---')
  console.log(leftPrompt)
  console.log('\n--- Right Variation Prompt ---')
  console.log(rightPrompt)
  console.log('=====================================\n')

  // Generate front variation first (uses uploaded photo)
  console.log('Generating front variation (step 1/3)...')
  const frontUrl = await generateImageWithNanoBanana(
    frontPrompt,
    [signedBasePhotoUrl],
    'match_input_image'
  ).then(url => {
    console.log('✅ Front variation generated:', url)
    return url
  }).catch(err => {
    console.error('❌ Front variation generation failed:', err)
    throw new Error(`Front variation generation failed: ${err.message}`)
  })

  // Generate left and right variations in parallel (both use front variation as input)
  console.log('Generating left and right variations (step 2/3)...')
  const [leftUrl, rightUrl] = await Promise.all([
    generateImageWithNanoBanana(
      leftPrompt,
      [frontUrl], // Use front variation as input
      'match_input_image'
    ).then(url => {
      console.log('✅ Left variation generated:', url)
      return url
    }).catch(err => {
      console.error('❌ Left variation generation failed:', err)
      throw new Error(`Left variation generation failed: ${err.message}`)
    }),
    generateImageWithNanoBanana(
      rightPrompt,
      [frontUrl], // Use front variation as input
      'match_input_image'
    ).then(url => {
      console.log('✅ Right variation generated:', url)
      return url
    }).catch(err => {
      console.error('❌ Right variation generation failed:', err)
      throw new Error(`Right variation generation failed: ${err.message}`)
    }),
  ])

  // Download and upload each variation to Supabase Storage
  const storagePath = `${userId}/${characterId}/${templateId}`
  console.log(`\nDownloading generated variations and uploading to storage...`)
  console.log(`Storage bucket: character-variations`)
  console.log(`Storage path: ${storagePath}`)

  const [frontBuffer, leftBuffer, rightBuffer] = await Promise.all([
    fetch(frontUrl).then((r) => {
      if (!r.ok) throw new Error(`Failed to download front variation: ${r.status}`)
      return r.arrayBuffer()
    }),
    fetch(leftUrl).then((r) => {
      if (!r.ok) throw new Error(`Failed to download left variation: ${r.status}`)
      return r.arrayBuffer()
    }),
    fetch(rightUrl).then((r) => {
      if (!r.ok) throw new Error(`Failed to download right variation: ${r.status}`)
      return r.arrayBuffer()
    }),
  ])

  console.log('Uploading variations to Supabase Storage...')
  let frontVariationUrl: string
  let leftVariationUrl: string
  let rightVariationUrl: string

  try {
    frontVariationUrl = await uploadToStorage('character-variations', `${storagePath}/front.jpg`, frontBuffer, 'image/jpeg')
    console.log('✅ Front variation uploaded:', frontVariationUrl)
  } catch (err: any) {
    console.error('❌ Failed to upload front variation:', err)
    throw new Error(`Failed to upload front variation to storage. Make sure 'character-variations' bucket exists in Supabase. Error: ${err.message}`)
  }

  try {
    leftVariationUrl = await uploadToStorage('character-variations', `${storagePath}/left.jpg`, leftBuffer, 'image/jpeg')
    console.log('✅ Left variation uploaded:', leftVariationUrl)
  } catch (err: any) {
    console.error('❌ Failed to upload left variation:', err)
    // Clean up front variation if left fails
    await deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {})
    throw new Error(`Failed to upload left variation to storage. Make sure 'character-variations' bucket exists in Supabase. Error: ${err.message}`)
  }

  try {
    rightVariationUrl = await uploadToStorage('character-variations', `${storagePath}/right.jpg`, rightBuffer, 'image/jpeg')
    console.log('✅ Right variation uploaded:', rightVariationUrl)
  } catch (err: any) {
    console.error('❌ Failed to upload right variation:', err)
    // Clean up front and left variations if right fails
    await Promise.all([
      deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {}),
      deleteFromStorage('character-variations', `${storagePath}/left.jpg`).catch(() => {}),
    ])
    throw new Error(`Failed to upload right variation to storage. Make sure 'character-variations' bucket exists in Supabase. Error: ${err.message}`)
  }

  // Store in database
  console.log('Saving character variations to database...')
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
    console.error('❌ Failed to save character variations to database:', insertError)
    // Clean up uploaded files if DB insert fails
    await Promise.all([
      deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {}),
      deleteFromStorage('character-variations', `${storagePath}/left.jpg`).catch(() => {}),
      deleteFromStorage('character-variations', `${storagePath}/right.jpg`).catch(() => {}),
    ])
    throw new Error(`Failed to save character variations to database: ${insertError.message}`)
  }

  console.log(`✅ Successfully generated and stored character variations for character ${characterId}`)
  console.log('Character variations URLs:')
  console.log(`  Front: ${frontVariationUrl}`)
  console.log(`  Left: ${leftVariationUrl}`)
  console.log(`  Right: ${rightVariationUrl}`)

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

