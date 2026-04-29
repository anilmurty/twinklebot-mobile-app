-- 077: Add slug column to story_templates for SEO-friendly URLs

-- Add nullable first so we can backfill
ALTER TABLE story_templates ADD COLUMN slug TEXT UNIQUE;

-- Backfill slugs from titles:
-- 1. Strip non-alphanumeric (keep spaces and hyphens)
-- 2. Replace whitespace runs with single hyphen
-- 3. Collapse multiple hyphens into one
-- 4. Trim leading/trailing hyphens
-- 5. Lowercase
UPDATE story_templates SET slug =
  trim(both '-' from
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(title),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-{2,}', '-', 'g'
    )
  );

-- Manual fixes for overly long slugs
UPDATE story_templates SET slug = 'alphabet-adventures-a-i' WHERE id = 23;
UPDATE story_templates SET slug = 'alphabet-adventures-j-r' WHERE id = 24;
UPDATE story_templates SET slug = 'alphabet-adventures-s-z' WHERE id = 25;
UPDATE story_templates SET slug = 'counting-1-to-10' WHERE id = 22;

-- Make NOT NULL after backfill
ALTER TABLE story_templates ALTER COLUMN slug SET NOT NULL;

-- Index for fast slug lookups
CREATE INDEX idx_story_templates_slug ON story_templates(slug);
