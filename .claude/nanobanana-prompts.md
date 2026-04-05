# Nano Banana Pro (Gemini) Prompts Reference

Model: `gemini-3-pro-image-preview` (nanobanana-pro) via Google Gemini API

---

## 2026-04-05 16:10 PT — Current Production Prompts

### 1. Character Avatar Generation

**File:** `lib/services/avatar-generator.ts`
**When:** Called at character upload time to create a full-body portrait on white background.
**Input images:** 1 (user's uploaded photo)
**Aspect ratio:** 1:1

```
create a full-length hyper-realistic digital portrait of this person standing upright, forward facing, on a plain white background. maintain the same facial features, hair color, hair style, skin tone, clothing, accessories, and shoes/footwear from the original portrait. use a natural, lifelike rendering style with soft studio lighting. if the original photo only shows the upper body, infer appropriate clothing and footwear for the lower body that matches the visible outfit.
```

---

### 2. Scene Insertion Prompts

**Files:** `lib/services/storybook-generator.ts`, `lib/services/preview-generator.ts`
**When:** Called for each scene during storybook/preview generation.

The avatar from step 1 is used directly as the character reference — there is no separate variation step.

#### 2a. With Custom Attire

**Input images:** 3 (base scene, character avatar, attire image)

```
place the character from the second image into the scene from the first image, matching the pose and position of the existing character in the scene. dress the character in the complete outfit shown in the third image, including shoes and footwear. maintain the character's facial features, hair, and skin tone. the result should look like the character was always part of this scene.
```

#### 2b. Without Custom Attire (original look or "original" scene)

**Input images:** 2 (base scene, character avatar)

```
place the character from the second image into the scene from the first image, matching the pose and position of the existing character in the scene. dress the character in the same clothing as the character already in the scene. maintain the character's facial features, hair, and skin tone. the result should look like the character was always part of this scene.
```

*Note: Attire is skipped when `is_original` is true on the selected look OR when the scene's `child_photo` is `'original'` (e.g. PJ/bedroom scenes where the base scene dictates clothing).*

---

### 3. Style Modifiers

Appended to the insertion prompt when a non-natural style is selected.

#### Natural
*(no modifier)*

#### Storybook
```
render the character and transform the entire scene in a watercolor picture book illustration style, soft painterly textures, warm pastel palette, gentle visible brushstrokes, professional picture book quality, maintaining consistent style across all scene elements.
```

#### Comic Book
```
render the character and transform the entire scene in comic book art style, bold black ink outlines applied consistently to all elements including background, flat vivid colors, dynamic composition, high contrast, professional comic illustration.
```

#### Cartoon
```
render the character and transform the entire scene in 3D animated movie style, smooth surfaces, vibrant saturated colors, soft studio lighting, Pixar-quality render, bright and cheerful, consistent style across character and background.
```

---

### 4. Scene-Specific Insertion Prompts

Each template has per-scene `insertion_prompt` values stored in `script_data.scenes[].insertion_prompt` in the `story_templates` database table. These are scene-specific instructions (e.g., "replace the child in the bedroom photo with the child in the white background. Match the pose of the child meeting CLEO."). The Gemini-safe prompt (section 2 above) overrides these at generation time.
