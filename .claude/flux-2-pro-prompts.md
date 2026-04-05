# FLUX.2 Pro Prompt Reference

## Version: 2026-04-05

**Model:** `black-forest-labs/flux-2-pro` on Replicate
**API Endpoint:** `POST /v1/models/black-forest-labs/flux-2-pro/predictions`
**Image Parameter:** `input_images` (array, up to 8 images)

---

## 1. Avatar Creation

**File:** `lib/services/avatar-generator.ts`
**Input images:** 1 (user's uploaded photo)
**Aspect ratio:** `1:1`

```
Create a full-length hyper-realistic digital portrait of the person in the
provided photo standing upright, forward facing, on a plain white background.
Maintain the same facial features, hair color, hair style, skin tone, clothing,
accessories, and shoes/footwear from the photo. Use a natural, lifelike
rendering style with soft studio lighting. If the photo only shows the upper
body, infer appropriate clothing and footwear for the lower body that matches
the visible outfit. It is very important that the generated portrait has the
exact physical features - hair style, hair color, eyes, eye color, skin tone,
height, weight and other attributes as the person in the photo.
```

---

## 2. Character Variation (for storybook generation)

**File:** `lib/services/character-variation-generator.ts`
**Aspect ratio:** `1:1`

### 2a. Original look (no custom attire)

**Input images:** 1 (user's avatar photo)
**Prompt source:** `selectedLook.prompt_modifier` from DB, or hardcoded default

**Default prompt (when no look selected):**
```
keep this person in their current outfit including shoes/footwear. keep facial
and body features identical to the original image. white background, forward
facing and full length
```

**Example DB prompt — "Original" look (after migration 069):**
```
keep this person in their current outfit including shoes/footwear. keep facial
and body features identical to the original image. ensure shoes/footwear are
included. white background, forward facing and full length
```

### 2b. Custom look (with attire image)

**Input images:** 2 (user's avatar photo + attire image from storage)
**Prompt source:** `selectedLook.prompt_modifier` from DB

**Example — "Casual" look (Day at the Zoo):**
```
dress this person in the complete outfit shown in the image, including shoes
and footwear. keep facial and body features identical to the original image.
white background, forward facing and full length
```

**Example — "Astronaut Blue" look (Mission to the Moon):**
```
dress this person in the complete astronaut suit shown in the image, including
boots and footwear. keep facial and body features identical to the original
image. white background, forward facing and full length
```

**Example — "Pajamas" look:**
```
dress this person in the pajamas shown in the image, including any slippers or
footwear. keep facial and body features identical to the original image. white
background, forward facing and full length
```

---

## 3. Scene Insertion (character into storybook scene)

**Files:** `lib/services/storybook-generator.ts`, `lib/services/preview-generator.ts`
**Both files use identical prompts.**

### 3a. Without custom attire

**Input images:** 2 (base scene photo + character avatar)
**Aspect ratio:** from template scene (typically `9:16`)

```
Replace the character in the scene with the character from the photo with the
white background. Match the pose, position, and body orientation of the existing
child in scene. The child in the final image must have the face, hair, skin
tone, and all features from the child in the white background photo. Dress the
child in the complete outfit shown in white background photo, including shoes
and footwear. Keep the background, lighting, art style, and all other elements
of scene completely unchanged. It is very important that the character in the
final generated image have the physical features (eyes, hair and skintone in
particular) as the character in the white background photo.
```

### 3b. With custom attire

**Input images:** 3 (base scene photo + character avatar + attire image)
**Aspect ratio:** from template scene (typically `9:16`)

```
Replace the character in the scene with the character from the photo with the
white background. Match the pose, position, and body orientation of the existing
child in scene. The child in the final image must have the face, hair, skin
tone, and all features from the child in the white background photo. Dress the
child in the complete outfit shown in the third image, including shoes and
footwear. Keep the background, lighting, art style, and all other elements of
scene completely unchanged. It is very important that the character in the final
generated image have the physical features (eyes, hair and skintone in
particular) as the character in the white background photo.
```

---

## 4. Style Modifiers

**Appended to the end of the scene insertion prompt (section 3).**
**Stored in:** `STYLE_MODIFIERS` constant in both `storybook-generator.ts` and `preview-generator.ts`

| Style | Modifier |
|-------|----------|
| `natural` | *(none — empty string)* |
| `storybook` | `Render the entire scene in a watercolor picture book illustration style with soft painterly textures, warm pastel palette, and gentle visible brushstrokes.` |
| `comic-book` | `Render the entire scene in comic book art style with bold black ink outlines, flat vivid colors, and high contrast.` |
| `cartoon` | `Render the entire scene in 3D animated movie style with smooth surfaces, vibrant saturated colors, and soft studio lighting.` |

### Constructed example: Scene insertion + custom attire + storybook style

**Input images:** 3 (base scene + character + astronaut suit attire)

```
Replace the character in the scene with the character from the photo with the
white background. Match the pose, position, and body orientation of the existing
child in scene. The child in the final image must have the face, hair, skin
tone, and all features from the child in the white background photo. Dress the
child in the complete outfit shown in the third image, including shoes and
footwear. Keep the background, lighting, art style, and all other elements of
scene completely unchanged. It is very important that the character in the final
generated image have the physical features (eyes, hair and skintone in
particular) as the character in the white background photo. Render the entire
scene in a watercolor picture book illustration style with soft painterly
textures, warm pastel palette, and gentle visible brushstrokes.
```

### Constructed example: Scene insertion + original attire + cartoon style

**Input images:** 2 (base scene + character)

```
Replace the character in the scene with the character from the photo with the
white background. Match the pose, position, and body orientation of the existing
child in scene. The child in the final image must have the face, hair, skin
tone, and all features from the child in the white background photo. Dress the
child in the complete outfit shown in white background photo, including shoes
and footwear. Keep the background, lighting, art style, and all other elements
of scene completely unchanged. It is very important that the character in the
final generated image have the physical features (eyes, hair and skintone in
particular) as the character in the white background photo. Render the entire
scene in 3D animated movie style with smooth surfaces, vibrant saturated colors,
and soft studio lighting.
```

---

## 5. Logic Notes

- **`useAttire`** is `true` when: `selectedLook` exists AND `selectedLook.is_original === false` AND `sceneTemplate.child_photo !== 'original'`
- **`child_photo === 'original'`** scenes (e.g. PJ/bedroom) skip attire — the base scene dictates clothing
- **Style modifiers** are appended with a space separator: `${insertionPrompt} ${styleModifier}`
- **Character variation** uses the look's `prompt_modifier` from the DB (not the insertion prompt)
- **`IMAGE_MODEL_VERSION` env var** overrides all model defaults globally
