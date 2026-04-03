# Gemini Content Moderation Workaround

## Overview

Four coordinated changes:
1. Remove "Natural" style — only storybook, comic-book, cartoon remain
2. Move character generation to upload time (background, via waitUntil)
3. Generate all 3 style variations at upload, delete original photo after success
4. Rewrite all prompts to be Gemini content-moderation safe (no age/gender references)

---

## Part 1 — Remove Natural Style

**Files to change:**
- `components/generate-story-dialog.tsx` — Remove from STYLE_OPTIONS, change default to 'cartoon'
- `components/create-story-dialog.tsx` — Same changes
- `lib/services/storybook-generator.ts` — Remove from StorybookStyle type, STYLE_MODIFIERS
- `lib/services/preview-generator.ts` — Same changes
- `lib/services/admin-alerts.ts` — Change fallback from 'natural' to 'cartoon'
- `db_scripts/` — New migration to change default from 'natural' to 'cartoon'

**Default style**: `cartoon` (replaces `natural`)

---

## Part 2 — Move Character Generation to Upload Time (Background)

**Current flow:**
1. Parent uploads photo → photo stored in Supabase → done
2. Story generation → character variation generated per template (slow, sends real photo)

**New flow:**
1. Parent uploads photo → API saves photo → returns immediately → `waitUntil` triggers background generation of 3 style variations → on success: delete original photo, store illustrated avatars
2. Story generation → matching style avatar retrieved (fast, no real photo sent)

**DB migration needed:**
- Add `avatar_status` column to characters table: `'pending' | 'generating' | 'ready' | 'failed'`
- Add `avatar_storybook_url`, `avatar_comic_url`, `avatar_cartoon_url` columns (TEXT, nullable)
- Add `avatar_error` column (TEXT, nullable)

**Character creation API (`app/api/v1/characters/route.ts`):**
- After saving photo, set `avatar_status = 'generating'`
- Use `waitUntil()` to trigger background generation of 3 style variations
- Background function:
  1. Call Gemini 3x (one per style) with style-specific prompts
  2. Upload each result to Supabase Storage: `{userId}/{characterId}/avatar-{style}.jpg`
  3. Update character record with avatar URLs + `avatar_status = 'ready'`
  4. Delete original photo from storage
  5. On failure: set `avatar_status = 'failed'`, `avatar_error = message`, keep original photo

**Character tab UI (`components/characters-tab.tsx`):**
- Show generating state (spinner overlay) when `avatar_status = 'generating'`
- Show failed state with retry button when `avatar_status = 'failed'`
- Show style variations when `avatar_status = 'ready'`
- Poll for updates while generating (reuse pattern from storybook polling)

**Character API (`app/api/v1/characters/route.ts` GET):**
- Return avatar_status, avatar URLs in response

---

## Part 3 — Character Generation Prompts (Gemini-Safe)

**Current prompt (flags E005):**
```
dress this girl in the clothing shown in the image. keep facial and body features identical...
```

**New prompts (per style, no gender/age references):**

Cartoon:
```
convert this portrait into a Pixar-style 3D animated character. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. white background, forward facing, full length, illustrated style.
```

Storybook:
```
convert this portrait into a watercolor children's book illustration character. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. soft painterly textures, warm pastel palette. white background, forward facing, full length.
```

Comic-book:
```
convert this portrait into a comic book art style character. bold black ink outlines, flat vivid colors. maintain the same facial features, hair color, hair style, and skin tone from the original portrait. white background, forward facing, full length.
```

**Input:** Single image (the uploaded photo). No outfit reference at this stage.

---

## Part 4 — Scene Insertion Prompt (Gemini-Safe)

**Current prompt (flags E005):**
```
replace the child in the [scene] photo with the child in the white background photo...
```

**New prompt template:**
```
place the illustrated character from the second image into the scene from the first image, matching the pose and position of the existing character in the scene. maintain the character's facial features, hair, skin tone, and clothing. the result should look like the character was always part of this scene.
```

**Key:** The second image is now an illustrated avatar, not a real photo → much less likely to trigger E005.

Style modifier is still appended per-style for consistent scene rendering.

---

## Part 5 — Update Story Generation Flow

**Changes to `lib/services/storybook-generator.ts`:**
- Instead of generating character variations at story time, retrieve pre-generated avatar
- Use `character.avatar_cartoon_url` (or matching style) instead of generating variation
- Remove/skip the character variation generation step
- If avatar not ready yet, fail gracefully with message

**Changes to `lib/services/preview-generator.ts`:**
- Same: use pre-generated avatar instead of generating variation

**Changes to `lib/services/character-variation-generator.ts`:**
- Keep file for now but it's no longer called from story/preview generation
- May be repurposed for regeneration feature later

---

## Implementation Status

All steps completed:

1. **DB migration** — `db_scripts/067_add_avatar_fields_to_characters.sql` (avatar_status, avatar URLs, avatar_error)
2. **DB migration** — `db_scripts/068_change_default_style_to_cartoon.sql` (default style → cartoon, migrate existing 'natural' rows)
3. **Remove Natural style** — Removed from `generate-story-dialog.tsx`, `create-story-dialog.tsx`, `storybook-generator.ts`, `preview-generator.ts`, `admin-alerts.ts`
4. **Avatar generator** — New `lib/services/avatar-generator.ts` — generates 3 style avatars via Gemini, uploads to storage, deletes original photo on success
5. **Character creation API** — `app/api/v1/characters/route.ts` POST triggers `waitUntil(generateAvatars(...))` after photo save
6. **Character GET API** — Returns `avatar_status`, all avatar URLs, and `avatar_error`
7. **Character tab UI** — `components/characters-tab.tsx` shows cartoon avatar when ready, spinner overlay when generating, error badge when failed, polls every 5s while generating
8. **Scene insertion prompts** — Gemini-safe prompts in both `storybook-generator.ts` and `preview-generator.ts` (no age/gender references)
9. **Story/preview generation** — Uses pre-generated avatar (matching storybook style) instead of generating character variations at story time. Falls back to old flow for legacy characters.
10. **Gemini integration** — `lib/services/gemini-image.ts` wraps Google Gemini API, used for both avatar generation and scene generation with p-limit concurrency throttling

---

## Failure Handling

- If any of the 3 style generations fails: set `avatar_status = 'failed'`, keep original photo
- User can retry from character tab
- Story/preview generation falls back to old character variation flow for legacy characters without avatars

## Remaining Tasks

- Run DB migrations (067, 068) on Supabase
- Test full end-to-end flow
- Commit and push
