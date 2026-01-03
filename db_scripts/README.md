# Database Migration Scripts

This folder contains all database migration scripts for the Twinklebot application.

## Naming Convention

Migration scripts should be named with a sequential number prefix:
- `001_initial_schema.sql`
- `002_add_feature_name.sql`
- `003_update_table_name.sql`

## Migration Structure

Each migration script should include:

1. **UP Migration**: Changes to apply
2. **DOWN Migration**: Changes to revert (commented out or in separate section)

## Running Migrations

### Via Supabase Dashboard
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste migration script
4. Run script

### Via Supabase CLI
\`\`\`bash
supabase db push
\`\`\`

### Via psql
\`\`\`bash
psql -h your-db-host -U postgres -d postgres -f 001_initial_schema.sql
\`\`\`

## Migration Checklist

Before creating a new migration:

- [ ] Review existing migrations
- [ ] Test migration on local/staging database first
- [ ] Include both UP and DOWN migrations
- [ ] Add comments explaining changes
- [ ] Update `db-schema.md` if schema changes
- [ ] Test rollback procedure

## Current Migrations

- `001_initial_schema.sql` - Initial database schema (profiles, characters, generation_models, story_templates, storybooks, generation_jobs)
- `002_seed_nano_banana_model.sql` - Seed nano-banana model configuration for image generation
- `003_seed_story_templates.sql` - Seed the 4 initial story templates (Counting Adventure, Alphabet Adventures 1-3) with prompts and scene data
- `004_update_template_storage_urls.sql` - Update story_templates to use Supabase Storage URLs (run after uploading images to storage)
- `005_create_profile_on_auth_trigger.sql` - Auto-create profile when user signs up (recommended)
- `006_add_limit_override.sql` - Add custom_stories_per_month column for per-user limit overrides (for early users, coupons, etc.)
- `007_add_alphabet_is_for_line.sql` - Add "A is for APPLE" format line to all alphabet scenes
- `008_remove_cover_image_url.sql` - Remove cover_image_url column from story_templates (only thumbnail_url is used)
