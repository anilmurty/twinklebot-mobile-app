/**
 * Image generation service using Replicate API or fal.ai
 * Set IMAGE_PROVIDER=fal to use fal.ai, defaults to replicate
 */

import { createFalPrediction, pollFalPrediction } from './fal-client'

type ImageProvider = 'replicate' | 'fal'

function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER?.toLowerCase()
  if (provider === 'fal') return 'fal'
  return 'replicate'
}

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

function getReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set')
  }
  return token
}

interface ReplicatePrediction {
  id: string
  model?: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
}

export async function createPrediction(
  modelVersion: string,
  input: Record<string, any>
): Promise<string> {
  // Replicate API uses "model" for model names (owner/name) and "version" for version hashes
  const isModelName = modelVersion.includes('/')
  const bodyPayload: Record<string, any> = { input }
  if (isModelName) {
    bodyPayload.model = modelVersion
  } else {
    bodyPayload.version = modelVersion
  }

  // Log the request for debugging (without sensitive data)
  console.log('Replicate API Request:', {
    ...(isModelName ? { model: modelVersion } : { version: modelVersion }),
    inputKeys: Object.keys(input),
    promptLength: input.prompt?.length || 0,
    imageInputCount: Array.isArray(input.input_images) ? input.input_images.length : (Array.isArray(input.image_input) ? input.image_input.length : 0),
    aspectRatio: input.aspect_ratio,
    outputFormat: input.output_format,
  })

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getReplicateToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Replicate API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    })
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`)
  }

  const prediction: ReplicatePrediction = await response.json()
  return prediction.id
}

export async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
    headers: {
      Authorization: `Token ${getReplicateToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get prediction: ${response.status}`)
  }

  return response.json()
}

export async function pollPrediction(
  predictionId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<string> {
  const { intervalMs = 5000, maxAttempts = 60 } = options
  let attempts = 0

  while (attempts < maxAttempts) {
    const prediction = await getPrediction(predictionId)

    if (prediction.status === 'succeeded') {
      if (!prediction.output) {
        throw new Error('Prediction succeeded but no output URL')
      }
      if (prediction.model) {
        console.log(`[REPLICATE] Prediction ${predictionId} completed using model: ${prediction.model}`)
      }
      return prediction.output
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(prediction.error || `Prediction ${prediction.status}`)
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('Prediction timeout')
}

/**
 * Convert Replicate-style input to fal.ai input format.
 * Replicate uses `image_input` or `input_images`, fal uses `image_urls`.
 */
function toFalInput(input: Record<string, any>): Record<string, any> {
  const { image_input, input_images, input_image, aspect_ratio, output_format, ...rest } = input
  // Normalize image inputs: array or single URI → array for fal
  const images = image_input || input_images || (input_image ? [input_image] : undefined)
  return {
    ...rest,
    image_urls: images,
    aspect_ratio: aspect_ratio === 'match_input_image' ? 'auto' : aspect_ratio,
    output_format: output_format === 'jpg' ? 'jpeg' : output_format,
  }
}

/**
 * Create a prediction using the configured provider (Replicate or fal.ai).
 */
export async function createProviderPrediction(
  modelVersion: string,
  input: Record<string, any>
): Promise<string> {
  const provider = getImageProvider()
  console.log(`🎨 Image provider: ${provider}`)

  if (provider === 'fal') {
    return createFalPrediction(toFalInput(input))
  }
  return createPrediction(modelVersion, input)
}

/**
 * Poll a prediction using the configured provider.
 */
export async function pollProviderPrediction(predictionId: string): Promise<string> {
  const provider = getImageProvider()
  if (provider === 'fal') {
    return pollFalPrediction(predictionId)
  }
  return pollPrediction(predictionId)
}

const DEFAULT_MODEL = 'black-forest-labs/flux-2-pro'

/**
 * Get model identifier from template's generation_model_id
 * Falls back to env var or default if template model not found
 */
async function getModelIdentifier(templateId?: number): Promise<string> {
  // Env var always takes priority (acts as a global override)
  if (process.env.IMAGE_MODEL_VERSION) {
    console.log(`✅ Using model from env var: ${process.env.IMAGE_MODEL_VERSION}`)
    return process.env.IMAGE_MODEL_VERSION
  }
  // Legacy env var support
  if (process.env.NANOBANANA_MODEL_VERSION) {
    console.log(`✅ Using model from legacy env var: ${process.env.NANOBANANA_MODEL_VERSION}`)
    return process.env.NANOBANANA_MODEL_VERSION
  }

  // If template ID provided, try to get model from template
  if (templateId) {
    try {
      const { supabaseAdmin } = await import('@/lib/supabase/server')
      const { data: template } = await supabaseAdmin
        .from('story_templates')
        .select(`
          generation_model_id,
          generation_models:generation_models!story_templates_generation_model_id_fkey(model_identifier)
        `)
        .eq('id', templateId)
        .single()

      if (template?.generation_models) {
        const modelData = Array.isArray(template.generation_models)
          ? template.generation_models[0]
          : template.generation_models
        const modelIdentifier = (modelData as any)?.model_identifier
        if (modelIdentifier) {
          console.log(`✅ Using model from template: ${modelIdentifier}`)
          return modelIdentifier
        }
      }
    } catch (error: any) {
      console.warn(`⚠️  Could not get model from template ${templateId}, falling back to default:`, error.message)
    }
  }

  return DEFAULT_MODEL
}

/**
 * Build model-specific input params.
 * Different models use different parameter names and support different options:
 * - flux-2-pro: input_images (array), use natural language referencing in prompts
 * - flux-kontext-pro: input_image (single URI), safety_tolerance
 * - nano-banana: image_input (array), output_format, match_input_image aspect ratio
 */
export function buildModelInput(
  modelIdentifier: string,
  prompt: string,
  imageInput: string[],
  aspectRatio: string,
): Record<string, any> {
  const isFluxKontext = modelIdentifier.includes('flux-kontext')
  const isFlux2 = modelIdentifier.includes('flux-2')
  const isFlux = modelIdentifier.includes('flux')
  const isNanoBanana = modelIdentifier.includes('nano-banana')

  // Resolve aspect ratio — flux-2-pro and other non-kontext/non-nano models need a real ratio
  let resolvedAspectRatio = aspectRatio
  if (!isNanoBanana && !isFluxKontext && (aspectRatio === 'match_input_image' || !aspectRatio)) {
    resolvedAspectRatio = '9:16'
  }

  const input: Record<string, any> = {
    prompt,
    aspect_ratio: resolvedAspectRatio,
  }

  // Image input parameter name differs by model
  if (isFluxKontext) {
    input.input_image = imageInput[imageInput.length - 1]
    input.output_format = 'jpg'
    input.safety_tolerance = 2
  } else if (isFlux) {
    // FLUX.2 Pro/Max and other flux models: input_images as an array
    input.input_images = imageInput
  } else {
    input.image_input = imageInput
  }

  // nano-banana also supports output_format
  if (isNanoBanana) {
    input.output_format = 'jpg'
  }

  return input
}

/**
 * Resolve model identifier to actual model name/version for Replicate API
 */
async function resolveModelVersion(modelIdentifier: string): Promise<string> {
  // Version IDs are typically long alphanumeric strings (e.g., "abc123def456...")
  // Model names contain slashes (e.g., "google/nano-banana-2")
  
  if (modelIdentifier.includes('/')) {
    // Model name format - use directly without API call
    // Most Replicate models accept model names directly, eliminating 1-4 second delay
    console.log('✅ Using model name directly (no API call):', modelIdentifier)
    return modelIdentifier
  } else {
    // Check if it looks like a valid version ID (long alphanumeric, no slashes)
    // Version IDs are typically 30+ characters and contain only alphanumeric characters
    // Prediction IDs are shorter (like the one user had: 1bwy6kt8r9rm80crx16t6161tm)
    if (modelIdentifier.length < 30 || !/^[a-z0-9]+$/i.test(modelIdentifier)) {
      console.error(`❌ Error: "${modelIdentifier}" appears to be a prediction ID, not a model version ID.`)
      console.error('📝 Solution: For models without exposed versions, use the model name:')
      console.error(`   Set NANOBANANA_MODEL_VERSION=${modelIdentifier.includes('/') ? modelIdentifier : 'google/nano-banana-2'} in .env.local`)
      throw new Error(`Invalid version ID format: "${modelIdentifier}". Use model name instead.`)
    }
    console.log('✅ Using provided model version ID:', modelIdentifier)
    return modelIdentifier
  }
}

export async function generateImageWithNanoBanana(
  prompt: string,
  characterPhotos: string[],
  aspectRatio: string = '9:16',
  templateId?: number // Optional: get model from template
): Promise<string> {
  // Get model identifier (from template or env/default)
  const modelIdentifier = await getModelIdentifier(templateId)
  const modelVersion = await resolveModelVersion(modelIdentifier)
  
  // Validate inputs
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required')
  }
  
  if (!characterPhotos || characterPhotos.length === 0) {
    throw new Error('Character photos are required')
  }
  
  // Ensure character photos are valid URLs
  const validPhotos = characterPhotos.filter(url => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })
  
  if (validPhotos.length === 0) {
    throw new Error('No valid character photo URLs provided')
  }
  
  console.log('Generating with:', {
    modelVersion,
    promptLength: prompt.length,
    photoCount: validPhotos.length,
    aspectRatio
  })
  
  const predictionId = await createProviderPrediction(modelVersion, buildModelInput(modelVersion, prompt, validPhotos, aspectRatio))

  return pollProviderPrediction(predictionId)
}

/**
 * Create a prediction for base photo + character variation + insertion prompt
 * Returns the prediction ID (does not wait for completion)
 */
export async function createBasePhotoAndCharacterPrediction(
  basePhotoPath: string, // Path to base photo in Supabase Storage (story-template-assets bucket)
  characterVariationUrl: string, // URL to character variation (front/left/right)
  insertionPrompt: string,
  aspectRatio: string = '9:16',
  templateId?: number, // Optional: get model from template
): Promise<string> {
  // Get model identifier (from template, or env/default)
  const modelIdentifier = await getModelIdentifier(templateId)
  const modelVersion = await resolveModelVersion(modelIdentifier)
  
  // Validate inputs
  if (!basePhotoPath || basePhotoPath.trim().length === 0) {
    throw new Error('Base photo path is required')
  }
  
  if (!characterVariationUrl || characterVariationUrl.trim().length === 0) {
    throw new Error('Character variation URL is required')
  }
  
  if (!insertionPrompt || insertionPrompt.trim().length === 0) {
    throw new Error('Insertion prompt is required')
  }
  
  // Validate URLs
  try {
    new URL(characterVariationUrl)
  } catch {
    throw new Error('Invalid character variation URL')
  }

  // Base photos should be in Supabase Storage (story-template-assets bucket)
  // Convert path like "/day-at-the-zoo/entrance.jpeg" to "day-at-the-zoo/entrance.jpeg"
  const storagePath = basePhotoPath.startsWith('/') 
    ? basePhotoPath.slice(1)
    : basePhotoPath

  // Get public URL from Supabase Storage
  const { getStorageUrl } = await import('@/lib/supabase/storage')
  const basePhotoUrl = getStorageUrl('story-template-assets', storagePath)

  console.log('\n=== SCENE IMAGE GENERATION ===')
  console.log(`Model identifier: ${modelIdentifier}`)
  console.log(`Model version: ${modelVersion}`)
  console.log(`Base photo URL: ${basePhotoUrl}`)
  console.log(`Character variation URL: ${characterVariationUrl}`)
  console.log(`\n--- INSERTION PROMPT (sent to Replicate) ---`)
  console.log(insertionPrompt)
  console.log(`\n--- END INSERTION PROMPT ---`)
  console.log(`Aspect ratio: ${aspectRatio}`)
  console.log(`Image input array: [basePhotoUrl, characterVariationUrl]`)
  
  console.log('=====================================\n')
  
  // Call image generation API with both images
  // The prompt is the insertion prompt, and we pass both images
  const predictionId = await createProviderPrediction(
    modelVersion,
    buildModelInput(modelVersion, insertionPrompt, [basePhotoUrl, characterVariationUrl], aspectRatio)
  )

  return predictionId
}

/**
 * Generate image using base photo + character variation + insertion prompt
 * This is the new approach for improved image quality and consistency
 * This function creates a prediction and polls for the result
 */
export async function generateImageWithBasePhotoAndCharacter(
  basePhotoPath: string, // Path to base photo in Supabase Storage (story-template-assets bucket)
  characterVariationUrl: string, // URL to character variation (front/left/right)
  insertionPrompt: string,
  aspectRatio: string = '9:16',
  templateId?: number, // Optional: get model from template
): Promise<string> {
  const predictionId = await createBasePhotoAndCharacterPrediction(
    basePhotoPath,
    characterVariationUrl,
    insertionPrompt,
    aspectRatio,
    templateId,
  )
  return pollProviderPrediction(predictionId)
}
