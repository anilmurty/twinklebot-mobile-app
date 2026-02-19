# Preview Generation Delay Analysis

## Problem
Significant delay between clicking "Generate" and the first Replicate prediction API call.

## Root Cause: Unnecessary Replicate API Calls

Before creating the first prediction, the code makes **TWO sequential Replicate API calls** to resolve the model version:

1. `GET /models/{owner}/{name}` - Get model info
2. `GET /models/{owner}/{name}/versions` - Get latest version

This happens in `character-variation-generator.ts` lines 171-184:
```typescript
if (modelIdentifier.includes('/')) {
  const { getModelVersion } = await import('./replicate-helper')
  const fetchedVersion = await getModelVersion(modelIdentifier)
  // ...
}
```

## Current Flow (Before First Prediction)

1. ✅ Database query: Get storybook + character + template (~100-200ms)
2. ✅ Database query: Check for existing character variations (~50-100ms)
3. ✅ Database query: Get character gender (~50-100ms)
4. ⚠️ Get signed URL from Supabase Storage (~200-500ms)
5. ✅ Database query: Get model identifier from template (~50-100ms)
6. ❌ **Replicate API call #1**: GET `/models/google/nano-banana-pro` (~500-2000ms)
7. ❌ **Replicate API call #2**: GET `/models/google/nano-banana-pro/versions` (~500-2000ms)
8. ✅ **Finally**: Create first prediction

**Total delay: ~1.5-5 seconds** before first prediction is created!

## Solution

Since we already store `model_identifier` in the database (`generation_models` table), we should:

1. **Store the resolved version ID** in the database when we first look it up
2. **Use the stored version ID directly** instead of making API calls every time
3. **Only resolve if version ID is missing** (for backward compatibility)

This would eliminate the 1-4 second delay before the first prediction.

## Additional Optimizations

1. **Parallelize database queries** where possible
2. **Cache signed URLs** (they're valid for 1 hour)
3. **Skip model version resolution** if we already have a version ID

