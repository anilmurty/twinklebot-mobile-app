# Switch Image Generation from Replicate to Google Gemini API

## Context

The app generates images in two steps, both currently using Replicate:
1. **Character variation**: user's uploaded photo → front-facing character on white background
2. **Scene insertion**: base scene photo (from Supabase Storage) + character variation + insertion prompt → final story scene

Both steps need to move to Google's Gemini API because:
- Replicate's flux-kontext-pro and seedream-4.5 flag children's photos as content violations
- Google's nano-banana models worked well but hit Google-imposed rate limits when accessed via Replicate
- Going direct to Google's API avoids Replicate as a middleman and gives us Google's own rate limits

There is NO "base scene generation" step — base scene photos are pre-made images in Supabase Storage (`story-template-assets` bucket). Nothing stays on Replicate.

## Model Selection

Start with **`gemini-3.1-flash-image-preview`** (Nano Banana 2):
- Cost: ~$0.045/image at 0.5K resolution
- Supports up to 14 reference images
- Optimized for speed and high-volume use

If likeness quality isn't good enough, swap to **`gemini-3-pro-image-preview`** (Nano Banana Pro, ~$0.134/image) — one-line model string change.

## Rate Limits (Google Direct API)

Per-project limits (not per-key):
- **Free tier**: 2 images/minute (not usable for production)
- **Tier 1 (pay-as-you-go)**: 10 images/minute
- **Tier 2**: 20 images/minute
- **Tier 3 (enterprise)**: 100+ images/minute

**Impact on story generation speed**: Currently scenes generate in parallel via Replicate (all ~10 scenes fire at once). With Gemini at 10 IPM (Tier 1), we'd need to throttle to ~1 image every 6 seconds. A 10-scene story would take ~60 seconds for scene insertion alone, plus character variation time. This is slower than current parallel generation but acceptable since stories already take 1-3 minutes. At Tier 2 (20 IPM) this halves to ~30 seconds.

The character variation step adds 1 image generation call before scenes start.

**Mitigation**: Use batch/sequential generation with delays rather than parallel `Promise.allSettled`. Or request Tier 2 access.

## SDK & Package

Install the newer **`@google/genai`** package (NOT the older `@google/generative-ai`):
```bash
npm install @google/genai
```

## Implementation Plan

### 1. Environment Setup
- Add `GOOGLE_AI_API_KEY` env var (get from https://aistudio.google.com/apikey)
- Add to `.env.local`, `.env.example`

### 2. Create Gemini Image Service (`lib/services/gemini-image.ts`)

New file with core function:

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

export async function generateImageWithGemini(
  prompt: string,
  referenceImageUrls: string[], // URLs to fetch and convert to base64
  aspectRatio: string = '1:1',
): Promise<Buffer> {
  // 1. Fetch each reference image URL → base64
  const imageContents = await Promise.all(
    referenceImageUrls.map(async (url) => {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: buffer.toString('base64'),
        },
      };
    })
  );

  // 2. Call Gemini API
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: [...imageContents, { text: prompt }],
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  // 3. Extract base64 image from response
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/')
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini did not return an image');
  }

  return Buffer.from(imagePart.inlineData.data, 'base64');
}
```

### 3. Upload Helper

Gemini returns base64, but the app expects URLs (stored in Supabase Storage). The flow:
1. Gemini returns image as base64 `Buffer`
2. Upload Buffer to Supabase Storage (same as current flow where we download from Replicate URL → upload to Storage)
3. Return the Supabase Storage URL

This matches the existing pattern in `character-variation-generator.ts` (lines 291-305) where we already download → upload.

### 4. Update Character Variation Generator (`lib/services/character-variation-generator.ts`)

Replace the Replicate `createProviderPrediction` + `pollProviderPrediction` call with:
```typescript
const imageBuffer = await generateImageWithGemini(frontPrompt, imageInputArray, '1:1');
// Upload buffer directly to Supabase Storage (skip download step)
frontVariationUrl = await uploadToStorage('character-variations', `${storagePath}/front.jpg`, imageBuffer, 'image/jpeg');
```

This is simpler than the current flow (no polling needed, no downloading from Replicate URL).

### 5. Update Scene Generation (`lib/services/storybook-generator.ts`)

Replace scene insertion calls. Currently `createBasePhotoAndCharacterPrediction()` + `pollProviderPrediction()`.

New flow:
```typescript
const imageBuffer = await generateImageWithGemini(insertionPrompt, [basePhotoUrl, characterVariationUrl], '9:16');
const sceneImageUrl = await uploadToStorage('storybook-scenes', `${storybookId}/${sceneNumber}.jpg`, imageBuffer, 'image/jpeg');
```

**Important**: Scenes currently generate in parallel. With Gemini rate limits (10 IPM Tier 1), we need to throttle. Options:
- Sequential generation with small delays
- Parallel with a concurrency limiter (e.g., p-limit with concurrency 2-3)
- Batch API (half price, higher limits, but async — adds complexity)

Recommend: **p-limit with concurrency 2** to stay safely under 10 IPM while still getting some parallelism.

### 6. Fallback

If `GOOGLE_AI_API_KEY` is not set, fall back to existing Replicate path with `console.warn`. This prevents breaking dev environments that haven't set up Google API keys yet.

### 7. Error Handling

- Gemini may return text instead of an image (e.g., refusal). Check for image part in response.
- Gemini may rate-limit with 429. Add retry with exponential backoff (1s, 2s, 4s).
- Content moderation: Gemini's own nano-banana models should handle children's photos fine (they worked on Replicate before rate limits hit).

## What Changes

| File | Change |
|------|--------|
| `package.json` | Add `@google/genai` |
| `.env.local` / `.env.example` | Add `GOOGLE_AI_API_KEY` |
| `lib/services/gemini-image.ts` | **New** — core Gemini image generation function |
| `lib/services/character-variation-generator.ts` | Replace Replicate calls with Gemini |
| `lib/services/storybook-generator.ts` | Replace scene insertion with Gemini + add rate limit throttling |
| `lib/services/image-generation.ts` | Keep as fallback, but primary path no longer uses it for generation |

## What Does NOT Change

- Insertion prompt text
- UI / story generation flow logic
- Base scene photos (still from Supabase Storage)
- Supabase Storage upload/download patterns
- Credit system, progress tracking, error states

## Cost Comparison

| Model | Cost/Image | Provider |
|-------|-----------|----------|
| Nano Banana 2 (Replicate) | ~$0.04 | Replicate |
| Nano Banana 2 (Gemini direct) | ~$0.045 | Google |
| flux-kontext-pro | ~$0.04 | Replicate |
| flux-2-pro (0.25MP) | ~$0.04 | Replicate |
| Nano Banana Pro (Gemini direct) | ~$0.134 | Google |

## Open Questions

1. What Google API tier are we on? Need to check/confirm IPM limits after setting up billing.
2. Should we request Tier 2 access upfront for 20 IPM?
3. Is the Batch API worth exploring for non-interactive generation (cheaper, higher limits, but adds latency)?
