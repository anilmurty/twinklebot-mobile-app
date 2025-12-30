-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Twinklebot
-- Created: 2024-01-01

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
  stories_per_month INTEGER DEFAULT 3,
  stories_generated_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
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

-- Character variations table
CREATE TABLE IF NOT EXISTS character_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES story_templates(id) ON DELETE CASCADE,
  front_variation_url TEXT NOT NULL,
  left_variation_url TEXT NOT NULL,
  right_variation_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, template_id)
);

-- Generation models table (for flexible model switching)
CREATE TABLE IF NOT EXISTS generation_models (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- e.g., 'nano-banana', 'flux', 'dalle-3'
  provider TEXT NOT NULL, -- 'replicate', 'openai', 'stability', etc.
  model_identifier TEXT NOT NULL, -- Model ID/version for the provider
  prompt_structure JSONB NOT NULL, -- Model-specific prompt structure config
  api_config JSONB NOT NULL, -- API-specific configuration (endpoints, params, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story templates table
CREATE TABLE IF NOT EXISTS story_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('numbers', 'letters')),
  age_range TEXT NOT NULL,
  scene_count INTEGER NOT NULL,
  cover_label TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  generation_model_id INTEGER NOT NULL REFERENCES generation_models(id),
  -- Fixed prompt parts (same for all scenes in this template)
  fixed_prompt_parts JSONB NOT NULL,
  -- Scene-specific data (varies per scene)
  script_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storybooks table
CREATE TABLE IF NOT EXISTS storybooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES story_templates(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 200), -- 0-95: character generation, 100-200: scene generation (UI subtracts 100)
  scenes JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Generation jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
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

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Characters indexes
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_name ON characters(user_id, name);

-- Character variations indexes
CREATE INDEX IF NOT EXISTS idx_character_variations_character_id ON character_variations(character_id);
CREATE INDEX IF NOT EXISTS idx_character_variations_template_id ON character_variations(template_id);
CREATE INDEX IF NOT EXISTS idx_character_variations_character_template ON character_variations(character_id, template_id);

-- Storybooks indexes
CREATE INDEX IF NOT EXISTS idx_storybooks_user_id ON storybooks(user_id);
CREATE INDEX IF NOT EXISTS idx_storybooks_status ON storybooks(status);
CREATE INDEX IF NOT EXISTS idx_storybooks_character_id ON storybooks(character_id);
CREATE INDEX IF NOT EXISTS idx_storybooks_template_id ON storybooks(template_id);
CREATE INDEX IF NOT EXISTS idx_storybooks_created_at ON storybooks(created_at DESC);

-- Generation models indexes
CREATE INDEX IF NOT EXISTS idx_generation_models_name ON generation_models(name);
CREATE INDEX IF NOT EXISTS idx_generation_models_is_active ON generation_models(is_active);

-- Story templates indexes
CREATE INDEX IF NOT EXISTS idx_story_templates_category ON story_templates(category);
CREATE INDEX IF NOT EXISTS idx_story_templates_is_active ON story_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_story_templates_generation_model_id ON story_templates(generation_model_id);

-- Generation jobs indexes
CREATE INDEX IF NOT EXISTS idx_generation_jobs_storybook_id ON generation_jobs(storybook_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly story counter (to be called via cron)
CREATE OR REPLACE FUNCTION reset_monthly_story_counter()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET stories_generated_this_month = 0
  WHERE stories_generated_this_month > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on characters
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on storybooks
DROP TRIGGER IF EXISTS update_storybooks_updated_at ON storybooks;
CREATE TRIGGER update_storybooks_updated_at
  BEFORE UPDATE ON storybooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on generation_models
DROP TRIGGER IF EXISTS update_generation_models_updated_at ON generation_models;
CREATE TRIGGER update_generation_models_updated_at
  BEFORE UPDATE ON generation_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE storybooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Characters policies
DROP POLICY IF EXISTS "Users can view own characters" ON characters;
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own characters" ON characters;
CREATE POLICY "Users can create own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own characters" ON characters;
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own characters" ON characters;
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- Character variations policies
DROP POLICY IF EXISTS "Users can view own character variations" ON character_variations;
CREATE POLICY "Users can view own character variations"
  ON character_variations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own character variations" ON character_variations;
CREATE POLICY "Users can create own character variations"
  ON character_variations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own character variations" ON character_variations;
CREATE POLICY "Users can delete own character variations"
  ON character_variations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_variations.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Generation models policies (admin only for write, public read for active)
DROP POLICY IF EXISTS "Anyone can view active generation models" ON generation_models;
CREATE POLICY "Anyone can view active generation models"
  ON generation_models FOR SELECT
  USING (is_active = true);

-- Story templates policies
DROP POLICY IF EXISTS "Anyone can view active story templates" ON story_templates;
CREATE POLICY "Anyone can view active story templates"
  ON story_templates FOR SELECT
  USING (is_active = true);

-- Storybooks policies
DROP POLICY IF EXISTS "Users can view own storybooks" ON storybooks;
CREATE POLICY "Users can view own storybooks"
  ON storybooks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own storybooks" ON storybooks;
CREATE POLICY "Users can create own storybooks"
  ON storybooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own storybooks" ON storybooks;
CREATE POLICY "Users can update own storybooks"
  ON storybooks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own storybooks" ON storybooks;
CREATE POLICY "Users can delete own storybooks"
  ON storybooks FOR DELETE
  USING (auth.uid() = user_id);

-- Generation jobs policies
DROP POLICY IF EXISTS "Users can view own generation jobs" ON generation_jobs;
CREATE POLICY "Users can view own generation jobs"
  ON generation_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM storybooks
      WHERE storybooks.id = generation_jobs.storybook_id
      AND storybooks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles linked to Supabase Auth';
COMMENT ON TABLE characters IS 'Child characters created by users for storybook generation';
COMMENT ON TABLE character_variations IS 'Generated character variations (front/left/right) for each character-template combination';
COMMENT ON TABLE generation_models IS 'Image generation model configurations for flexible model switching';
COMMENT ON TABLE story_templates IS 'Pre-defined story templates with scripts and prompts';
COMMENT ON TABLE storybooks IS 'Generated storybooks with scenes stored in JSONB';
COMMENT ON TABLE generation_jobs IS 'Background job tracking for storybook generation';

COMMENT ON COLUMN characters.name IS 'Character name (max 20 alphanumeric chars, unique per user)';
COMMENT ON COLUMN generation_models.prompt_structure IS 'JSONB defining how to construct prompts for this model (e.g., order, separators, placeholders)';
COMMENT ON COLUMN generation_models.api_config IS 'JSONB containing API-specific settings (endpoints, auth, rate limits, etc.)';
COMMENT ON COLUMN story_templates.fixed_prompt_parts IS 'JSONB containing prompt parts that are the same for all scenes (deprecated in new approach)';
COMMENT ON COLUMN story_templates.script_data IS 'JSONB containing scene-specific scripts with base_photo, child_photo (front/left/right), and insertion_prompt for each scene';
COMMENT ON COLUMN character_variations.front_variation_url IS 'URL to front-facing character variation image';
COMMENT ON COLUMN character_variations.left_variation_url IS 'URL to left-facing character variation image';
COMMENT ON COLUMN character_variations.right_variation_url IS 'URL to right-facing character variation image';
COMMENT ON COLUMN storybooks.scenes IS 'JSONB array of generated scenes with image_url, text, and metadata';
COMMENT ON COLUMN storybooks.status IS 'Generation status: pending, generating, completed, or failed';
COMMENT ON COLUMN generation_jobs.replicate_prediction_ids IS 'JSONB mapping scene numbers to Replicate prediction IDs';

