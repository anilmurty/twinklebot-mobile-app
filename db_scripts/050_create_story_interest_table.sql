-- 050: Create story_interest table for "Notify Me" feature
-- Tracks which users are interested in coming-soon story templates

CREATE TABLE story_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id INTEGER NOT NULL REFERENCES story_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- Index for fast lookups by user (e.g. "which templates has this user expressed interest in?")
CREATE INDEX idx_story_interest_user_id ON story_interest(user_id);

-- Index for aggregating interest counts per template
CREATE INDEX idx_story_interest_template_id ON story_interest(template_id);

-- Enable RLS
ALTER TABLE story_interest ENABLE ROW LEVEL SECURITY;

-- Users can view their own interest rows
CREATE POLICY "Users can view own interest"
  ON story_interest FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own interest rows
CREATE POLICY "Users can insert own interest"
  ON story_interest FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interest rows
CREATE POLICY "Users can delete own interest"
  ON story_interest FOR DELETE
  USING (auth.uid() = user_id);

-- Service role has full access (bypasses RLS by default)
