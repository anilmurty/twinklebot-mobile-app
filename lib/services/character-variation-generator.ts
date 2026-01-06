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
  userId: string,
  storybookId?: string, // Optional: for progress tracking
  skipExistenceCheck: boolean = false // Skip redundant existence check if already done
): Promise<CharacterVariations> {
  // Check if variations already exist (unless caller already checked)
  if (!skipExistenceCheck) {
    const existing = await getCharacterVariations(characterId, templateId)
    if (existing) {
      console.log(`Character variations already exist for character ${characterId} and template ${templateId}`)
      return existing
    }
  }

  const variationGenStartTime = Date.now()
  console.log(`[TIMING] Character variation generation started at ${new Date().toISOString()}`)
  console.log(`Generating character variations for character ${characterId} and template ${templateId}`)

  // Fetch character's gender from database
  const genderQueryStart = Date.now()
  const { data: characterData, error: characterError } = await supabaseAdmin
    .from('characters')
    .select('gender')
    .eq('id', characterId)
    .single()
  console.log(`[TIMING] Gender query: ${Date.now() - genderQueryStart}ms`)

  if (characterError || !characterData) {
    throw new Error(`Failed to fetch character data: ${characterError?.message || 'Character not found'}`)
  }

  const gender = characterData.gender as 'male' | 'female'
  if (!gender || !['male', 'female'].includes(gender)) {
    throw new Error(`Invalid or missing gender for character ${characterId}`)
  }

  console.log(`Character gender: ${gender}`)

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

  const pathExtractionStart = Date.now()
  const basePhotoPath = getPhotoPath(basePhotoUrl)
  console.log(`[TIMING] Extracted photo path: ${Date.now() - pathExtractionStart}ms`)
  
  const signedUrlStart = Date.now()
  console.log(`[TIMING] Getting signed URL at ${new Date().toISOString()}`)
  const signedBasePhotoUrl = await getSignedUrl('character-photos', basePhotoPath, 3600)
  console.log(`[TIMING] Got signed URL: ${Date.now() - signedUrlStart}ms`)

  // Generate three variations with prompts for different views
  // Front variation: Use uploaded photo, dress for zoo (gender-specific)
  const frontPrompt = gender === 'male'
    ? "dress this little boy to look like he is ready for a day at the zoo. keep facial features identical to the original image. white background and full length"
    : "dress this little girl to look like she is ready for a day at the zoo. keep facial features identical to the original image. white background and full length"
  
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

  // Get model identifier from template
  const modelQueryStart = Date.now()
  let modelIdentifier: string = process.env.NANOBANANA_MODEL_VERSION || 'google/nano-banana-pro'
  try {
    const { data: template } = await supabaseAdmin
      .from('story_templates')
      .select(`
        generation_model_id,
        generation_models:generation_models!story_templates_generation_model_id_fkey(model_identifier)
      `)
      .eq('id', templateId)
      .single()
  console.log(`[TIMING] Model identifier query: ${Date.now() - modelQueryStart}ms`)

    if (template?.generation_models) {
      const modelData = Array.isArray(template.generation_models) 
        ? template.generation_models[0] 
        : template.generation_models
      const templateModelId = (modelData as any)?.model_identifier
      if (templateModelId) {
        modelIdentifier = templateModelId
        console.log(`✅ Using model from template: ${modelIdentifier}`)
      }
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not get model from template ${templateId}, using default:`, error.message)
  }
  
  console.log(`Using model identifier: ${modelIdentifier}`)

  // Use model identifier directly - most Replicate models accept model names (e.g., "google/nano-banana-pro")
  // Only resolve to version ID if absolutely necessary (most models work with names)
  // This eliminates 1-4 seconds of delay from unnecessary API calls
  let modelVersion = modelIdentifier
  
  // Only resolve if it looks like a version ID is required (long alphanumeric string)
  // Model names contain '/' and can be used directly
  if (!modelIdentifier.includes('/') && modelIdentifier.length > 30) {
    // Looks like a version ID already, use it directly
    console.log(`✅ Using provided version ID: ${modelIdentifier}`)
  } else {
    // Model name format (e.g., "google/nano-banana-pro") - use directly
    // Replicate accepts model names for most models, no need to resolve
    console.log(`✅ Using model name directly (no API call needed): ${modelIdentifier}`)
  }

  // Generate front variation first (uses uploaded photo)
  console.log('Generating front variation (step 1/3)...')
  let frontUrl: string
  
  if (storybookId) {
    const importStart = Date.now()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const { createPrediction, pollPrediction } = await import('./image-generation')
    console.log(`[TIMING] Imported modules: ${Date.now() - importStart}ms`)
    
    // Create prediction and update progress to 40% when prediction is created (10% base + 30% for char 1)
    const predictionCreateStart = Date.now()
    const totalTimeBeforePrediction = Date.now() - variationGenStartTime
    console.log(`[TIMING] ⏱️  TOTAL TIME BEFORE FIRST PREDICTION: ${totalTimeBeforePrediction}ms (${(totalTimeBeforePrediction/1000).toFixed(2)}s)`)
    console.log(`[TIMING] Creating first Replicate prediction at ${new Date().toISOString()}`)
    const predictionId = await createPrediction(
      modelVersion,
      {
        prompt: frontPrompt,
        image_input: [signedBasePhotoUrl],
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
      }
    )
    
    console.log(`[TIMING] Created prediction ${predictionId}: ${Date.now() - predictionCreateStart}ms`)
    
    const progressUpdateStart = Date.now()
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 40, updated_at: new Date().toISOString() })
      .eq('id', storybookId)
    console.log(`[TIMING] Updated progress to 40%: ${Date.now() - progressUpdateStart}ms`)
    
    // Now poll for result
    const pollStart = Date.now()
    frontUrl = await pollPrediction(predictionId)
    console.log(`[TIMING] Polled prediction result: ${Date.now() - pollStart}ms`)
    console.log('✅ Front variation generated:', frontUrl)
  } else {
    // No storybookId, use regular function
    const { generateImageWithNanoBanana } = await import('./image-generation')
    frontUrl = await generateImageWithNanoBanana(
      frontPrompt,
      [signedBasePhotoUrl],
      'match_input_image',
      templateId // Pass template ID to get model from template
    ).then(url => {
      console.log('✅ Front variation generated:', url)
      return url
    }).catch(err => {
      console.error('❌ Front variation generation failed:', err)
      throw new Error(`Front variation generation failed: ${err.message}`)
    })
  }

  // Generate left and right variations in parallel (both use front variation as input)
  console.log('Generating left and right variations (step 2/3)...')
  let leftUrl: string
  let rightUrl: string
  
  if (storybookId) {
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const { createPrediction, pollPrediction } = await import('./image-generation')
    
    // Create both predictions first, then update progress
    const [leftPredictionId, rightPredictionId] = await Promise.all([
      createPrediction(
        modelVersion,
        {
          prompt: leftPrompt,
          image_input: [frontUrl],
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
        }
      ),
      createPrediction(
        modelVersion,
        {
          prompt: rightPrompt,
          image_input: [frontUrl],
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
        }
      ),
    ])
    
    // Update progress to 70% when predictions are created (10% base + 30% for char 1 + 30% for char 2)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 70, updated_at: new Date().toISOString() })
      .eq('id', storybookId)
    
    // Poll for both results
    const [leftResult, rightResult] = await Promise.all([
      pollPrediction(leftPredictionId).then(url => {
        console.log('✅ Left variation generated:', url)
        return url
      }).catch(err => {
        console.error('❌ Left variation generation failed:', err)
        throw new Error(`Left variation generation failed: ${err.message}`)
      }),
      pollPrediction(rightPredictionId).then(url => {
        console.log('✅ Right variation generated:', url)
        return url
      }).catch(err => {
        console.error('❌ Right variation generation failed:', err)
        throw new Error(`Right variation generation failed: ${err.message}`)
      }),
    ])
    
    leftUrl = leftResult
    rightUrl = rightResult
    
    // Update progress to 100% after all variations generated (10% base + 30% * 3 = 100%)
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 100, updated_at: new Date().toISOString() })
      .eq('id', storybookId)
  } else {
    // No storybookId, use regular function
    const { generateImageWithNanoBanana } = await import('./image-generation')
    const [leftResult, rightResult] = await Promise.all([
      generateImageWithNanoBanana(
        leftPrompt,
        [frontUrl], // Use front variation as input
        'match_input_image',
        templateId // Pass template ID to get model from template
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
        'match_input_image',
        templateId // Pass template ID to get model from template
      ).then(url => {
        console.log('✅ Right variation generated:', url)
        return url
      }).catch(err => {
        console.error('❌ Right variation generation failed:', err)
        throw new Error(`Right variation generation failed: ${err.message}`)
      }),
    ])
    
    leftUrl = leftResult
    rightUrl = rightResult
  }

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
