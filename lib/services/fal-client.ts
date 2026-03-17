/**
 * Image generation client for fal.ai API
 * Drop-in alternative to Replicate for nano-banana-2
 */

const FAL_API_URL = 'https://queue.fal.run'

function getFalKey(): string {
  const key = process.env.FAL_KEY
  if (!key) {
    throw new Error('FAL_KEY environment variable is not set')
  }
  return key
}

interface FalQueueResponse {
  request_id: string
  status: string
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  response_url?: string
  error?: string
}

interface FalResultResponse {
  images: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
}

/**
 * Submit an image generation request to fal.ai queue.
 * Returns a request_id (analogous to Replicate's prediction ID).
 */
export async function createFalPrediction(
  input: Record<string, any>
): Promise<string> {
  console.log('fal.ai API Request:', {
    inputKeys: Object.keys(input),
    promptLength: input.prompt?.length || 0,
    imageUrlCount: Array.isArray(input.image_urls) ? input.image_urls.length : 0,
    aspectRatio: input.aspect_ratio,
    outputFormat: input.output_format,
  })

  const response = await fetch(`${FAL_API_URL}/fal-ai/nano-banana-2/edit`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${getFalKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('fal.ai API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    })
    throw new Error(`fal.ai API error: ${response.status} - ${errorText}`)
  }

  const data: FalQueueResponse = await response.json()
  return data.request_id
}

/**
 * Check the status of a fal.ai request.
 */
export async function getFalStatus(requestId: string): Promise<FalStatusResponse> {
  const response = await fetch(
    `${FAL_API_URL}/fal-ai/nano-banana-2/edit/requests/${requestId}/status`,
    {
      headers: {
        Authorization: `Key ${getFalKey()}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get fal.ai status: ${response.status}`)
  }

  return response.json()
}

/**
 * Get the result of a completed fal.ai request.
 */
async function getFalResult(requestId: string): Promise<FalResultResponse> {
  const response = await fetch(
    `${FAL_API_URL}/fal-ai/nano-banana-2/edit/requests/${requestId}`,
    {
      headers: {
        Authorization: `Key ${getFalKey()}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get fal.ai result: ${response.status}`)
  }

  return response.json()
}

/**
 * Poll a fal.ai request until completion, then return the output image URL.
 */
export async function pollFalPrediction(
  requestId: string,
  options: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<string> {
  const { intervalMs = 3000, maxAttempts = 80 } = options
  let attempts = 0

  while (attempts < maxAttempts) {
    const status = await getFalStatus(requestId)

    if (status.status === 'COMPLETED') {
      const result = await getFalResult(requestId)
      if (!result.images || result.images.length === 0) {
        throw new Error('fal.ai prediction succeeded but no output images')
      }
      return result.images[0].url
    }

    if (status.status === 'FAILED') {
      throw new Error(status.error || 'fal.ai prediction failed')
    }

    // IN_QUEUE or IN_PROGRESS — wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    attempts++
  }

  throw new Error('fal.ai prediction timeout')
}
