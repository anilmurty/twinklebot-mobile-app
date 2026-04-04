-- Restore 'natural' as the default style for storybooks
-- Migration 068 changed it to 'cartoon' when we removed the natural style
-- Now that natural is back, restore it as the default

ALTER TABLE storybooks ALTER COLUMN style SET DEFAULT 'natural';
