/**
 * Character variation generation service
 * Generates front/left/right variations of a character for a specific story template
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithNanoBanana } from './image-generation'
import { uploadToStorage, getSignedUrl, deleteFromStorage, getStorageUrl } from '@/lib/supabase/storage'

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

  // Extract storage path from URL (synchronous, can be done immediately)
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

  // PARALLELIZE: Fetch character gender and model identifier simultaneously
  const parallelQueriesStart = Date.now()
  const [characterResult, templateResult] = await Promise.all([
    // Fetch character's gender from database
    supabaseAdmin
      .from('characters')
      .select('gender')
      .eq('id', characterId)
      .single(),
    // Get model identifier from template
    supabaseAdmin
      .from('story_templates')
      .select(`
        generation_model_id,
        generation_models:generation_models!story_templates_generation_model_id_fkey(model_identifier)
      `)
      .eq('id', templateId)
      .single()
  ])
  console.log(`[TIMING] Parallel queries (gender + model): ${Date.now() - parallelQueriesStart}ms`)

  const { data: characterData, error: characterError } = characterResult
  if (characterError || !characterData) {
    throw new Error(`Failed to fetch character data: ${characterError?.message || 'Character not found'}`)
  }

  const gender = characterData.gender as 'male' | 'female'
  if (!gender || !['male', 'female'].includes(gender)) {
    throw new Error(`Invalid or missing gender for character ${characterId}`)
  }

  console.log(`Character gender: ${gender}`)

  // Process model identifier
  let modelIdentifier: string = process.env.NANOBANANA_MODEL_VERSION || 'google/nano-banana-pro'
  const { data: template, error: templateError } = templateResult
  if (!templateError && template?.generation_models) {
    const modelData = Array.isArray(template.generation_models) 
      ? template.generation_models[0] 
      : template.generation_models
    const templateModelId = (modelData as any)?.model_identifier
    if (templateModelId) {
      modelIdentifier = templateModelId
      console.log(`✅ Using model from template: ${modelIdentifier}`)
    }
  } else if (templateError) {
    console.warn(`⚠️  Could not get model from template ${templateId}, using default:`, templateError.message)
  }
  
  console.log(`Using model identifier: ${modelIdentifier}`)
  
  // Get signed URL (this is the slowest operation - network call to Supabase Storage)
  const signedUrlStart = Date.now()
  console.log(`[TIMING] Getting signed URL at ${new Date().toISOString()}`)
  const signedBasePhotoUrl = await getSignedUrl('character-photos', basePhotoPath, 3600)
  console.log(`[TIMING] Got signed URL: ${Date.now() - signedUrlStart}ms`)

  // Fetch selected look if storybookId is provided
  let selectedLook: { attire_image_url: string; prompt_modifier: string; is_original: boolean } | null = null
  if (storybookId) {
    const lookFetchStart = Date.now()
    const { data: storybook } = await supabaseAdmin
      .from('storybooks')
      .select('look_id, character_looks:look_id(attire_image_url, prompt_modifier, is_original)')
      .eq('id', storybookId)
      .single()
    
    if (storybook?.look_id && storybook.character_looks) {
      const lookData = Array.isArray(storybook.character_looks) 
        ? storybook.character_looks[0] 
        : storybook.character_looks
      selectedLook = lookData as any
      console.log(`[TIMING] Fetched look data: ${Date.now() - lookFetchStart}ms`)
      console.log(`Selected look: ${selectedLook.is_original ? 'Original' : 'Custom'}`)
    }
  }

  // Generate prompts based on selected look
  let frontPrompt: string
  let imageInputArray: string[]

  if (selectedLook && !selectedLook.is_original) {
    // Custom look selected: use attire image + user photo + prompt modifier
    frontPrompt = selectedLook.prompt_modifier
    // Get signed URL for attire image (if it's in Supabase Storage)
    let attireImageUrl = selectedLook.attire_image_url
    // If attire image is a relative path or Supabase Storage path, convert to signed URL
    if (attireImageUrl && !attireImageUrl.startsWith('http')) {
      // Assume it's in story-template-assets bucket
      const attirePath = attireImageUrl.startsWith('/') ? attireImageUrl.slice(1) : attireImageUrl
      attireImageUrl = getStorageUrl('story-template-assets', attirePath)
    } else if (attireImageUrl && attireImageUrl.includes('supabase.co') && !attireImageUrl.includes('/object/public/')) {
      // Private Supabase Storage URL - need signed URL
      const attireMatch = attireImageUrl.match(/story-template-assets\/(.+)$/)
      if (attireMatch) {
        attireImageUrl = await getSignedUrl('story-template-assets', attireMatch[1], 3600)
      }
    }
    imageInputArray = [signedBasePhotoUrl, attireImageUrl] // User photo first, then attire
    console.log(`Using custom look with attire image`)
  } else {
    // Original look: use default prompt with just user photo
    frontPrompt = gender === 'male'
      ? "dress this little boy to look like he is ready for a day at the zoo. keep facial features identical to the original image. white background and full length"
      : "dress this little girl to look like she is ready for a day at the zoo. keep facial features identical to the original image. white background and full length"
    imageInputArray = [signedBasePhotoUrl] // Just user photo
    console.log(`Using original look (no attire image)`)
  }

  // Log prompts for debugging
  console.log('\n=== CHARACTER VARIATION GENERATION ===')
  console.log(`Character ID: ${characterId}`)
  console.log(`Template ID: ${templateId}`)
  console.log(`Base photo URL: ${signedBasePhotoUrl}`)
  console.log('\n--- Front Variation Prompt ---')
  console.log(frontPrompt)
  console.log('=====================================\n')

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

  // Generate front variation only (we use this for all scenes)
  console.log('Generating front variation...')
  let frontUrl: string
  
  if (storybookId) {
    const importStart = Date.now()
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const { createPrediction, pollPrediction } = await import('./image-generation')
    console.log(`[TIMING] Imported modules: ${Date.now() - importStart}ms`)
    
    // Create prediction and update progress
    const predictionCreateStart = Date.now()
    const totalTimeBeforePrediction = Date.now() - variationGenStartTime
    console.log(`[TIMING] ⏱️  TOTAL TIME BEFORE FIRST PREDICTION: ${totalTimeBeforePrediction}ms (${(totalTimeBeforePrediction/1000).toFixed(2)}s)`)
    console.log(`[TIMING] Creating first Replicate prediction at ${new Date().toISOString()}`)
    const predictionId = await createPrediction(
      modelVersion,
      {
        prompt: frontPrompt,
        image_input: imageInputArray, // Use attire image if custom look selected
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
      }
    )
    
    console.log(`[TIMING] Created prediction ${predictionId}: ${Date.now() - predictionCreateStart}ms`)
    
    const progressUpdateStart = Date.now()
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: 50, updated_at: new Date().toISOString() })
      .eq('id', storybookId)
    console.log(`[TIMING] Updated progress to 50%: ${Date.now() - progressUpdateStart}ms`)
    
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
      imageInputArray, // Use attire image if custom look selected
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

  // Download and upload front variation to Supabase Storage
  const storagePath = `${userId}/${characterId}/${templateId}`
  console.log(`\nDownloading generated variation and uploading to storage...`)
  console.log(`Storage bucket: character-variations`)
  console.log(`Storage path: ${storagePath}`)

  const frontBuffer = await fetch(frontUrl).then((r) => {
    if (!r.ok) throw new Error(`Failed to download front variation: ${r.status}`)
    return r.arrayBuffer()
  })

  console.log('Uploading variation to Supabase Storage...')
  let frontVariationUrl: string

  try {
    frontVariationUrl = await uploadToStorage('character-variations', `${storagePath}/front.jpg`, frontBuffer, 'image/jpeg')
    console.log('✅ Front variation uploaded:', frontVariationUrl)
  } catch (err: any) {
    console.error('❌ Failed to upload front variation:', err)
    throw new Error(`Failed to upload front variation to storage. Make sure 'character-variations' bucket exists in Supabase. Error: ${err.message}`)
  }

  // Store in database using upsert to handle race conditions
  // Store front URL in all three fields since we only generate one variation
  console.log('Saving character variation to database...')
  const { error: insertError } = await supabaseAdmin
    .from('character_variations')
    .upsert({
      character_id: characterId,
      template_id: templateId,
      front_variation_url: frontVariationUrl,
      left_variation_url: frontVariationUrl, // Use front for all
      right_variation_url: frontVariationUrl, // Use front for all
    }, {
      onConflict: 'character_id,template_id'
    })

  if (insertError) {
    console.error('❌ Failed to save character variation to database:', insertError)
    // Clean up uploaded file if DB insert fails
    await deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch(() => {})
    throw new Error(`Failed to save character variation to database: ${insertError.message}`)
  }

  console.log(`✅ Successfully generated and stored character variation for character ${characterId}`)
  console.log('Character variation URL:', frontVariationUrl)

  return {
    front_variation_url: frontVariationUrl,
    left_variation_url: frontVariationUrl, // Use front for all
    right_variation_url: frontVariationUrl, // Use front for all
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
