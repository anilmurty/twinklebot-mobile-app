# Look Customization Feature Implementation

## Overview
Users can now choose how their character appears in each story by selecting from predefined "looks" (outfits/styles) specific to each story template.

## Database Schema

### `character_looks` table
- Stores look options for each story template, organized by gender
- Fields:
  - `id`: Primary key
  - `template_id`: References story_templates
  - `gender`: 'male' or 'female'
  - `look_name`: Display name (e.g., "Safari Explorer")
  - `display_order`: Order for display
  - `reference_image_url`: Model image shown to user in selection UI (preview of how child looks)
  - `attire_image_url`: Attire image sent to Replicate API along with user photo (clothing/outfit reference)
  - `prompt_modifier`: Additional prompt text for this look
  - `is_original`: If true, uses original uploaded photo (attire_image_url not used)
  - `is_active`: Enable/disable looks

### `storybooks.look_id` field
- Stores the selected look for each storybook
- NULL means "original" was selected

## User Flow

1. User selects template/character (existing step)
2. **NEW: User selects look** (3 story-specific looks + "original")
   - Sees model images (how a child looks in that outfit)
   - Selects one look
3. User clicks "Generate Preview"
4. Character variations are generated:
   - **Custom look**: Uses attire image + user photo + prompt_modifier
   - **Original look**: Uses just user photo + default prompt
5. Preview generation continues as before

## Image Types

- **Model images** (6 total: 3 boy + 3 girl): Shown to users in selection UI
- **Attire images** (6 total: 3 boy + 3 girl): Sent to Replicate API with user's photo

## API Endpoints

- `GET /api/v1/character-looks?template_id=1&gender=male`
  - Returns looks for a template and gender
  - Ordered by: original first, then display_order

## Implementation Files

### Database
- `db_scripts/025_create_character_looks_table.sql` - Creates looks table
- `db_scripts/026_add_look_id_to_storybooks.sql` - Adds look_id to storybooks
- `db_scripts/027_seed_day_at_zoo_looks.sql` - Seeds Day at the Zoo looks (to be created with user's images)

### API
- `app/api/v1/character-looks/route.ts` - Fetch looks endpoint
- `app/api/v1/storybooks/route.ts` - Updated to accept look_id

### Frontend
- `components/create-story-dialog.tsx` - Add look selection step
- `components/generate-story-dialog.tsx` - Add look selection step
- `lib/api-client.ts` - Add characterLooksApi

### Services
- `lib/services/character-variation-generator.ts` - Use look's prompt and attire image
  - Fetches storybook's look_id
  - If custom look: passes [user_photo, attire_image] + prompt_modifier to Replicate
  - If original: passes [user_photo] + default prompt to Replicate

## Next Steps

1. User provides 12 images for Day at the Zoo:
   - 3 boy model images (shown in UI)
   - 3 boy attire images (sent to Replicate)
   - 3 girl model images (shown in UI)
   - 3 girl attire images (sent to Replicate)
2. User provides prompt modifiers for each look (3 per gender)
3. Create migration script `027_seed_day_at_zoo_looks.sql` with:
   - reference_image_url (model images)
   - attire_image_url (attire images)
   - prompt_modifier (custom prompts)
4. Test the full flow

