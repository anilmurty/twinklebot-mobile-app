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
  - `reference_image_url`: Image shown to user and passed to Replicate
  - `prompt_modifier`: Additional prompt text for this look
  - `is_original`: If true, uses original uploaded photo
  - `is_active`: Enable/disable looks

### `storybooks.look_id` field
- Stores the selected look for each storybook
- NULL means "original" was selected

## User Flow

1. User selects template (existing step)
2. **NEW: User selects look** (3 story-specific looks + "original")
3. User clicks "Generate Preview"
4. Character variations are generated using selected look's prompt and reference image
5. Preview generation continues as before

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
- `lib/services/character-variation-generator.ts` - Use look's prompt and reference image

## Next Steps

1. User provides 6 images (3 male, 3 female) for Day at the Zoo
2. User provides prompt modifiers for each look
3. Create migration script `027_seed_day_at_zoo_looks.sql` with images and prompts
4. Test the full flow

