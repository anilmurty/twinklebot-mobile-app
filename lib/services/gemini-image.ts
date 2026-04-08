/**
 * Google Gemini image generation service
 * Uses Nano Banana Pro (gemini-3-pro-image-preview) for character avatar
 * and scene insertion.
 */

import { GoogleGenAI } from '@google/genai'

const DEFAULT_MODEL = 'gemini-3-pro-image-preview'

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

  let response
  try {
    response = await Promise.race([generatePromise, timeoutPromise])
  } catch (error: any) {
    // Send urgent email alert for billing/quota exhaustion (429 RESOURCE_EXHAUSTED)
    if (error?.message?.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('429') || error?.code === 429) {
      sendBillingAlert(error.message).catch(() => {}) // fire-and-forget
    }
    throw error
  }
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

/**
 * Send an urgent email alert when Google AI billing credits are exhausted.
 * Uses Resend API directly to avoid circular dependency with admin-alerts.
 */
let lastBillingAlertSent = 0
async function sendBillingAlert(errorMessage: string): Promise<void> {
  // Throttle: max one alert per 10 minutes to avoid spam during retries
  const now = Date.now()
  if (now - lastBillingAlertSent < 10 * 60 * 1000) {
    console.log('[GEMINI] Billing alert already sent recently, skipping')
    return
  }
  lastBillingAlertSent = now

  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!resendKey || !adminEmail) {
    console.log('[GEMINI] Resend not configured, cannot send billing alert')
    return
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TwinkleBot Alerts <alerts@twinklebot.app>',
        to: [adminEmail],
        subject: 'Add funds to Google AI Account for Twinklebot ASAP',
        html: `<p>Add funds to Google AI account or image generation will stop.</p>
<p><a href="https://aistudio.google.com/billing">https://aistudio.google.com/billing</a></p>
<p style="margin-top:16px;color:#888;font-size:12px;">Error: ${errorMessage}</p>
<p style="color:#888;font-size:12px;">Timestamp: ${new Date().toISOString()}</p>`,
      }),
    })
    console.log('[GEMINI] Billing alert email sent')
  } catch (err) {
    console.error('[GEMINI] Failed to send billing alert:', err)
  }
}
