# Twinklebot Database Schema

## Overview

This document describes the complete database schema for Twinklebot. The database uses PostgreSQL via Supabase.

## Tables

### profiles

User profiles linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
  stories_per_month INTEGER DEFAULT 3,
  stories_generated_this_month INTEGER DEFAULT 0,
  custom_stories_per_month INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: UUID, primary key, references `auth.users(id)`
- `email`: User email address (unique)
- `full_name`: User's full name
- `avatar_url`: URL to user's profile picture
- `subscription_plan`: Current subscription tier ('free' or 'premium')
- `stories_per_month`: Number of stories allowed per month based on plan
- `stories_generated_this_month`: Counter for current month's story generation
- `custom_stories_per_month`: Custom monthly limit override (NULL = use plan limit). Set to a number to override the plan limit for specific users (e.g., early users, coupons, promotions)
- `created_at`: Timestamp when profile was created
- `updated_at`: Timestamp when profile was last updated

**Indexes:**
- Primary key on `id`
- Unique index on `email`

---

### characters

Child characters created by users for storybook generation.

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL,
  front_photo_url TEXT NOT NULL,
  left_photo_url TEXT NOT NULL,
  right_photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

**Columns:**
- `id`: UUID, primary key
- `user_id`: Foreign key to `profiles.id`
- `name`: Character name (max 20 alphanumeric characters, unique per user)
- `front_photo_url`: URL to front-facing photo in Supabase Storage
- `left_photo_url`: URL to left-facing photo in Supabase Storage
- `right_photo_url`: URL to right-facing photo in Supabase Storage
- `created_at`: Timestamp when character was created
- `updated_at`: Timestamp when character was last updated

**Constraints:**
- `UNIQUE(user_id, name)`: Character names must be unique per user

**Indexes:**
- Primary key on `id`
- Index on `user_id` for faster lookups
- Unique index on `(user_id, name)`

---

### generation_models

Image generation model configurations for flexible model switching.

```sql
CREATE TABLE generation_models (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  model_identifier TEXT NOT NULL,
  prompt_structure JSONB NOT NULL,
  api_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Serial integer, primary key
- `name`: Model name (e.g., 'nano-banana', 'flux', 'dalle-3')
- `provider`: Provider name (e.g., 'replicate', 'openai', 'stability')
- `model_identifier`: Model ID/version for the provider API
- `prompt_structure`: JSONB defining how to construct prompts for this model
- `api_config`: JSONB containing API-specific settings
- `is_active`: Whether model is available for use
- `created_at`: Timestamp when model was added
- `updated_at`: Timestamp when model config was last updated

**prompt_structure Example (nano-banana):**
```json
{
  "parts_order": ["subject", "action", "detail", "style"],
  "separator": "\n\n",
  "placeholders": {
    "character_name": "{character_name}"
  },
  "fixed_parts": ["subject", "style"],
  "variable_parts": ["action", "detail"]
}
```

**api_config Example (nano-banana via Replicate):**
```json
{
  "endpoint": "https://api.replicate.com/v1/predictions",
  "auth_header": "Authorization",
  "auth_prefix": "Token",
  "input_params": {
    "prompt": "string",
    "image_input": "array",
    "aspect_ratio": "string",
    "output_format": "string"
  },
  "polling": {
    "interval_ms": 5000,
    "max_attempts": 60
  }
}
```

**Indexes:**
- Primary key on `id`
- Unique index on `name`
- Index on `is_active` for filtering active models

---

### story_templates

Pre-defined story templates with scripts and prompts.

```sql
CREATE TABLE story_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('numbers', 'letters')),
  age_range TEXT NOT NULL,
  scene_count INTEGER NOT NULL,
  cover_label TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  generation_model_id INTEGER NOT NULL REFERENCES generation_models(id),
  fixed_prompt_parts JSONB NOT NULL,
  script_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Serial integer, primary key
- `title`: Template title (e.g., "Counting Adventure")
- `description`: Template description
- `category`: Story category ('numbers' or 'letters')
- `age_range`: Target age range (e.g., "2-5 years")
- `scene_count`: Number of scenes in this template
- `cover_label`: Label shown on cover (e.g., "1-10", "A-I")
- `cover_image_url`: URL to pre-generated cover image
- `thumbnail_url`: URL to thumbnail image
- `generation_model_id`: Foreign key to `generation_models.id`
- `fixed_prompt_parts`: JSONB containing prompt parts that are the same for all scenes
- `script_data`: JSONB object containing scene-specific scripts and prompt parts
- `is_active`: Whether template is available for use
- `created_at`: Timestamp when template was created

**fixed_prompt_parts Structure (nano-banana example):**
```json
{
  "subject": "A vibrant 3D cartoon version of {character_name} from the reference images. The child must have the same hair color, hair style, facial features, skin color and joyful expression as seen in the photos. It is very important to get these accurate.",
  "style": "Whimsical storybook aesthetic, 3D animation style (like Pixar), soft lighting. Ensure the child's face is clearly visible and the hero of the image. The bottom 20% of the image should be simple background to allow for a text overlay."
}
```

**script_data Structure:**
```json
{
  "scenes": [
    {
      "scene_number": 1,
      "script_text": "Adam counted ONE big red apple on the dining table.",
      "action": "{character_name} is pointing at ONE big red apple on a wooden dining table with excitement.",
      "detail": "The apple is prominently displayed in the center. The scene is bright and colorful, suitable for children's book illustration.",
      "number": 1,
      "aspect_ratio": "9:16"
    },
    {
      "scene_number": 2,
      "script_text": "Adam counted TWO big red apples on the dining table.",
      "action": "{character_name} is pointing at TWO big red apples on a wooden dining table with excitement.",
      "detail": "The two apples are prominently displayed in the center. The scene is bright and colorful, suitable for children's book illustration.",
      "number": 2,
      "aspect_ratio": "9:16"
    }
  ]
}
```

**Indexes:**
- Primary key on `id`
- Index on `is_active` for filtering active templates
- Index on `generation_model_id` for filtering by model

---

### storybooks

Generated storybooks with scenes.

```sql
CREATE TABLE storybooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES story_templates(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  scenes JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Columns:**
- `id`: UUID, primary key
- `user_id`: Foreign key to `profiles.id`
- `character_id`: Foreign key to `characters.id`
- `template_id`: Foreign key to `story_templates.id`
- `title`: Storybook title (usually matches template title)
- `status`: Current generation status
  - `pending`: Queued for generation
  - `generating`: Currently being generated
  - `completed`: All scenes generated successfully
  - `failed`: Generation failed
- `progress`: Generation progress percentage (0-100)
- `scenes`: JSONB array of generated scenes
- `error_message`: Error message if generation failed
- `created_at`: Timestamp when storybook was created
- `updated_at`: Timestamp when storybook was last updated
- `completed_at`: Timestamp when generation completed

**scenes Structure:**
```json
[
  {
    "scene_number": 1,
    "image_url": "https://supabase-storage-url/scene-1.jpg",
    "text": "Adam counted ONE big red apple on the dining table.",
    "number": 1,
    "generated_at": "2024-01-01T12:00:00Z"
  }
]
```

**Indexes:**
- Primary key on `id`
- Index on `user_id` for faster lookups
- Index on `status` for filtering by status
- Index on `character_id`
- Index on `template_id`

---

### generation_jobs

Background job tracking for storybook generation.

```sql
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storybook_id UUID NOT NULL REFERENCES storybooks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  current_scene INTEGER DEFAULT 0,
  total_scenes INTEGER NOT NULL,
  replicate_prediction_ids JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Columns:**
- `id`: UUID, primary key
- `storybook_id`: Foreign key to `storybooks.id`
- `status`: Job status
  - `queued`: Waiting to be processed
  - `processing`: Currently being processed
  - `completed`: Successfully completed
  - `failed`: Failed with error
- `current_scene`: Current scene being generated (0-indexed)
- `total_scenes`: Total number of scenes to generate
- `replicate_prediction_ids`: JSONB object mapping scene numbers to Replicate prediction IDs
- `error_message`: Error message if job failed
- `created_at`: Timestamp when job was created
- `started_at`: Timestamp when job started processing
- `completed_at`: Timestamp when job completed

**replicate_prediction_ids Structure:**
```json
{
  "1": "prediction-id-1",
  "2": "prediction-id-2"
}
```

**Indexes:**
- Primary key on `id`
- Index on `storybook_id`
- Index on `status` for filtering queued/processing jobs

---

## Row Level Security (RLS) Policies

### profiles

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### characters

```sql
-- Users can read their own characters
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own characters
CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own characters
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own characters
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);
```

### storybooks

```sql
-- Users can read their own storybooks
CREATE POLICY "Users can view own storybooks"
  ON storybooks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own storybooks
CREATE POLICY "Users can create own storybooks"
  ON storybooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own storybooks
CREATE POLICY "Users can update own storybooks"
  ON storybooks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own storybooks
CREATE POLICY "Users can delete own storybooks"
  ON storybooks FOR DELETE
  USING (auth.uid() = user_id);
```

### story_templates

```sql
-- Everyone can read active story templates
CREATE POLICY "Anyone can view active story templates"
  ON story_templates FOR SELECT
  USING (is_active = true);
```

### generation_jobs

```sql
-- Users can read jobs for their own storybooks
CREATE POLICY "Users can view own generation jobs"
  ON generation_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM storybooks
      WHERE storybooks.id = generation_jobs.storybook_id
      AND storybooks.user_id = auth.uid()
    )
  );
```

---

## Storage Buckets

### character-photos

Private bucket for storing character photos.

**Path Structure:**
```
{user_id}/{character_id}/front.jpg
{user_id}/{character_id}/left.jpg
{user_id}/{character_id}/right.jpg
```

**Policies:**
- Users can upload to their own folder
- Users can read their own photos
- Users can delete their own photos

### storybook-scenes

Private bucket for storing generated storybook scene images.

**Path Structure:**
```
{storybook_id}/scene-1.jpg
{storybook_id}/scene-2.jpg
...
```

**Policies:**
- System can upload scenes (service role)
- Users can read scenes for their own storybooks
- Users can delete scenes for their own storybooks

### story-template-assets

Public bucket for story template cover images and thumbnails.

**Path Structure:**
```
covers/{template_id}.jpg
thumbnails/{template_id}.jpg
```

**Policies:**
- Public read access
- Admin write access only

---

## Functions & Triggers

### Update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storybooks_updated_at
  BEFORE UPDATE ON storybooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Reset monthly story counter

```sql
CREATE OR REPLACE FUNCTION reset_monthly_story_counter()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET stories_generated_this_month = 0
  WHERE stories_generated_this_month > 0;
END;
$$ LANGUAGE plpgsql;

-- Run via cron job on 1st of each month
```

---

## Initial Data

### Story Templates

Story templates should be seeded with:
1. Counting Adventure (10 scenes)
2. Alphabet Adventure 1 (9 scenes, A-I)
3. Alphabet Adventure 2 (9 scenes, J-R)
4. Alphabet Adventure 3 (8 scenes, S-Z)

See migration scripts in `db_scripts/` folder for initial template data.

---

## Migration Strategy

All database changes should be tracked in migration scripts located in `db_scripts/` folder. Each migration should:

1. Be numbered sequentially (001, 002, 003, etc.)
2. Include both UP and DOWN migrations
3. Be idempotent (safe to run multiple times)
4. Include comments explaining changes

Example naming:
- `001_initial_schema.sql`
- `002_add_monthly_counter_reset.sql`
- `003_add_storybook_tags.sql`

