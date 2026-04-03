-- Add avatar generation fields to characters table
-- Supports generating illustrated character avatars at upload time
-- in 3 styles: cartoon, storybook, comic-book

ALTER TABLE characters ADD COLUMN IF NOT EXISTS avatar_status VARCHAR(20) DEFAULT 'pending' NOT NULL
  CHECK (avatar_status IN ('pending', 'generating', 'ready', 'failed'));

ALTER TABLE characters ADD COLUMN IF NOT EXISTS avatar_cartoon_url TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS avatar_storybook_url TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS avatar_comic_url TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS avatar_error TEXT;
