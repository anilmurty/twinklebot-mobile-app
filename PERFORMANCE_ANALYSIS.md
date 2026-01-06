# Preview Generation Performance Analysis

## Time Breakdown

### Character Variations Generation (if not cached)

**Front Variation:**
- `pollPrediction` default: 60 attempts × 5 seconds = **5 minutes max**
- Sequential: Must complete before left/right can start

**Left + Right Variations:**
- Created in parallel (good!)
- Each: `pollPrediction` default: 60 attempts × 5 seconds = **5 minutes max**
- Since parallel: Takes max(left, right) = **5 minutes max**

**Total Character Variations:**
- Front: ~5 minutes
- Left+Right (parallel): ~5 minutes
- **Total: ~10 minutes worst case**

### First Scene Generation

**Scene Image:**
- `pollPrediction` default: 60 attempts × 5 seconds = **5 minutes max**

**Total First Scene: ~5 minutes worst case**

### Overall Preview Generation

**Total Worst Case: ~15 minutes**
- Character variations: ~10 minutes
- First scene: ~5 minutes

## Current Timeout Settings

### Backend (`pollPrediction`):
- `intervalMs = 5000` (5 seconds between polls)
- `maxAttempts = 60` (60 attempts max)
- **Timeout: 60 × 5 = 300 seconds = 5 minutes per prediction**

### Frontend Polling:
- `maxAttempts = 1800` (1800 attempts)
- `pollInterval = 500ms` (0.5 seconds between polls)
- **Timeout: 1800 × 0.5 = 900 seconds = 15 minutes**

## Bottlenecks Identified

1. **Sequential Character Variation Generation**
   - Front variation must complete before left/right can start
   - **Impact**: Adds ~5 minutes unnecessarily
   - **Fix**: Could start left/right immediately after front prediction is created (don't wait for completion)

2. **Conservative Polling Timeout**
   - 5 minutes per prediction may be too long if Replicate typically completes in 10-15 seconds
   - **Impact**: If Replicate fails or hangs, we wait full 5 minutes
   - **Fix**: Could reduce to 2-3 minutes with better error handling

3. **URL Validation Overhead**
   - Each scene generation validates base photo and character variation URLs with HEAD requests
   - **Impact**: Adds ~1-2 seconds per scene
   - **Fix**: Could cache validation or skip if URLs are known to be valid

4. **No Early Completion Detection**
   - Frontend polls every 500ms but backend may complete much faster
   - **Impact**: Unnecessary polling overhead
   - **Fix**: Backend could use webhooks or more frequent progress updates

## Recommendations

1. **Optimize Character Variation Generation**
   - Start left/right predictions immediately after front prediction is created (don't wait for front to complete)
   - This would reduce total time from ~10 minutes to ~5 minutes

2. **Reduce Polling Interval**
   - Backend: Reduce from 5 seconds to 2-3 seconds for faster detection
   - Frontend: Keep 500ms (already good)

3. **Add Progress Updates**
   - Backend should update progress more frequently during `pollPrediction`
   - This would give better UX and allow frontend to show more accurate progress

4. **Consider Webhooks**
   - Replicate supports webhooks for prediction completion
   - Would eliminate polling overhead entirely

5. **Add Timeout Detection**
   - If a prediction takes > 2 minutes, log warning
   - If > 4 minutes, consider retrying with new prediction

