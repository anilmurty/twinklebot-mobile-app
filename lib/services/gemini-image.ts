/**
 * Google Gemini image generation service
 * Uses Nano Banana 2 (gemini-3.1-flash-image-preview) for character variation
 * and scene insertion, replacing Replicate.
 */

import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview'

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set')
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Fetch an image URL and return it as a base64 string.
 */
async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${res.status}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer.toString('base64')
}

/**
 * Generate an image using Google Gemini with reference images.
 *
 * @param prompt - The text prompt describing what to generate
 * @param referenceImageUrls - URLs of reference images (e.g. character photo, base scene)
 * @param aspectRatio - Aspect ratio for the output image (e.g. '1:1', '9:16')
 * @returns Buffer containing the generated JPEG image
 */
export async function generateImageWithGemini(
  prompt: string,
  referenceImageUrls: string[],
  aspectRatio: string = '1:1',
): Promise<Buffer> {
  const ai = getGeminiClient()

  console.log(`[GEMINI] Generating image with ${referenceImageUrls.length} reference image(s)`)
  console.log(`[GEMINI] Model: ${DEFAULT_MODEL}`)
  console.log(`[GEMINI] Aspect ratio: ${aspectRatio}`)
  console.log(`[GEMINI] Prompt length: ${prompt.length}`)

  // Fetch all reference images as base64 in parallel
  const fetchStart = Date.now()
  const base64Images = await Promise.all(referenceImageUrls.map(urlToBase64))
  console.log(`[GEMINI] Fetched ${base64Images.length} reference image(s): ${Date.now() - fetchStart}ms`)

  // Build contents array: images first, then prompt
  const imageContents = base64Images.map((data) => ({
    inlineData: {
      mimeType: 'image/jpeg' as const,
      data,
    },
  }))

  const genStart = Date.now()
  const GEMINI_TIMEOUT_MS = 90_000 // 90 seconds — fail fast so retries have time

  const generatePromise = ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [...imageContents, { text: prompt }],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
  })

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini generation timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)), GEMINI_TIMEOUT_MS)
  )

  const response = await Promise.race([generatePromise, timeoutPromise])
  console.log(`[GEMINI] Generation completed: ${Date.now() - genStart}ms`)

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts
  if (!parts) {
    throw new Error('Gemini returned no content parts')
  }

  const imagePart = parts.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData?.data) {
    // Check if there's a text refusal
    const textPart = parts.find((p: any) => p.text)
    if (textPart) {
      throw new Error(`Gemini refused to generate image: ${(textPart as any).text}`)
    }
    throw new Error('Gemini did not return an image')
  }

  const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64')
  console.log(`[GEMINI] Generated image size: ${(imageBuffer.length / 1024).toFixed(1)}KB`)

  return imageBuffer
}

/**
 * Check if Gemini is available (API key is set).
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY
}
