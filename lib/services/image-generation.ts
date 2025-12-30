/**
 * Image generation service using Replicate API
 */

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
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string
  error?: string
}

export async function createPrediction(
  modelVersion: string,
  input: Record<string, any>
): Promise<string> {
  // Log the request for debugging (without sensitive data)
  console.log('Replicate API Request:', {
    version: modelVersion,
    inputKeys: Object.keys(input),
    promptLength: input.prompt?.length || 0,
    imageInputCount: Array.isArray(input.image_input) ? input.image_input.length : 0,
    aspectRatio: input.aspect_ratio,
    outputFormat: input.output_format,
  })

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getReplicateToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion,
      input,
    }),
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

export async function generateImageWithNanoBanana(
  prompt: string,
  characterPhotos: string[],
  aspectRatio: string = 'match_input_image'
): Promise<string> {
  // Get model version ID (or use provided version)
  let modelVersion = process.env.NANOBANANA_MODEL_VERSION || 'google/nano-banana'
  
  // Version IDs are typically long alphanumeric strings (e.g., "abc123def456...")
  // Model names contain slashes (e.g., "google/nano-banana")
  // If it looks like a model name (contains slash), try to fetch version
  if (modelVersion.includes('/')) {
    const { getModelVersion } = await import('./replicate-helper')
    try {
      const fetchedVersion = await getModelVersion('google/nano-banana')
      // Check if we got the special marker indicating model doesn't expose versions
      if (fetchedVersion === 'MODEL_NAME_REQUIRED') {
        console.log('ℹ️  Model does not expose versions via API, using model name directly')
        modelVersion = 'google/nano-banana' // Use model name directly
      } else {
        console.log('✅ Using model version ID:', fetchedVersion)
        modelVersion = fetchedVersion
      }
    } catch (error: any) {
      throw new Error(`Failed to get model version. Please set NANOBANANA_MODEL_VERSION in .env.local. ${error.message}`)
    }
  } else {
    // Check if it looks like a valid version ID (long alphanumeric, no slashes)
    // Version IDs are typically 30+ characters and contain only alphanumeric characters
    // Prediction IDs are shorter (like the one user had: 1bwy6kt8r9rm80crx16t6161tm)
    if (modelVersion.length < 30 || !/^[a-z0-9]+$/i.test(modelVersion)) {
      console.error(`❌ Error: "${modelVersion}" appears to be a prediction ID, not a model version ID.`)
      console.error('   Prediction IDs are shorter and come from completed predictions.')
      console.error('   Version IDs are longer (30+ chars) and come from the model\'s API examples.')
      console.error('')
      console.error('📝 Solution: For models without exposed versions, use the model name:')
      console.error('   Set NANOBANANA_MODEL_VERSION=google/nano-banana in .env.local')
      console.error('   Or remove NANOBANANA_MODEL_VERSION to use the default')
      throw new Error(`Invalid version ID format: "${modelVersion}". Use model name "google/nano-banana" instead.`)
    }
    console.log('✅ Using provided model version ID:', modelVersion)
  }
  
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
  
  const predictionId = await createPrediction(modelVersion, {
    prompt,
    image_input: validPhotos,
    aspect_ratio: aspectRatio,
    output_format: 'jpg',
  })

  return pollPrediction(predictionId)
}

/**
 * Generate image using base photo + character variation + insertion prompt
 * This is the new approach for improved image quality and consistency
 */
export async function generateImageWithBasePhotoAndCharacter(
  basePhotoPath: string, // Path to base photo in /public/day-at-the-zoo/
  characterVariationUrl: string, // URL to character variation (front/left/right)
  insertionPrompt: string,
  aspectRatio: string = 'match_input_image'
): Promise<string> {
  // Get model version ID (or use provided version)
  let modelVersion = process.env.NANOBANANA_MODEL_VERSION || 'google/nano-banana'
  
  // Version IDs are typically long alphanumeric strings (e.g., "abc123def456...")
  // Model names contain slashes (e.g., "google/nano-banana")
  // If it looks like a model name (contains slash), try to fetch version
  if (modelVersion.includes('/')) {
    const { getModelVersion } = await import('./replicate-helper')
    try {
      const fetchedVersion = await getModelVersion('google/nano-banana')
      // Check if we got the special marker indicating model doesn't expose versions
      if (fetchedVersion === 'MODEL_NAME_REQUIRED') {
        console.log('ℹ️  Model does not expose versions via API, using model name directly')
        modelVersion = 'google/nano-banana' // Use model name directly
      } else {
        console.log('✅ Using model version ID:', fetchedVersion)
        modelVersion = fetchedVersion
      }
    } catch (error: any) {
      throw new Error(`Failed to get model version. Please set NANOBANANA_MODEL_VERSION in .env.local. ${error.message}`)
    }
  } else {
    // Check if it looks like a valid version ID (long alphanumeric, no slashes)
    if (modelVersion.length < 30 || !/^[a-z0-9]+$/i.test(modelVersion)) {
      console.error(`❌ Error: "${modelVersion}" appears to be a prediction ID, not a model version ID.`)
      console.error('📝 Solution: For models without exposed versions, use the model name:')
      console.error('   Set NANOBANANA_MODEL_VERSION=google/nano-banana in .env.local')
      throw new Error(`Invalid version ID format: "${modelVersion}". Use model name "google/nano-banana" instead.`)
    }
    console.log('✅ Using provided model version ID:', modelVersion)
  }
  
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

  // Construct full URL for base photo (from public folder)
  // In Next.js, public folder files are served from root
  // For production, use VERCEL_URL or NEXT_PUBLIC_SITE_URL
  // For development, use localhost
  const getBaseUrl = () => {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL
    }
    return 'http://localhost:3000'
  }

  const basePhotoUrl = basePhotoPath.startsWith('/') 
    ? `${getBaseUrl()}${basePhotoPath}`
    : `${getBaseUrl()}/${basePhotoPath}`

  console.log('Generating with base photo + character variation:', {
    modelVersion,
    basePhotoUrl,
    characterVariationUrl,
    insertionPromptLength: insertionPrompt.length,
    aspectRatio
  })
  
  // Call Replicate API with both images
  // The prompt is the insertion prompt, and we pass both images
  const predictionId = await createPrediction(modelVersion, {
    prompt: insertionPrompt,
    image_input: [basePhotoUrl, characterVariationUrl], // Base photo first, then character variation
    aspect_ratio: aspectRatio,
    output_format: 'jpg',
  })

  return pollPrediction(predictionId)
}

