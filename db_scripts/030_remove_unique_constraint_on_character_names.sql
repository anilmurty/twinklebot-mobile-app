-- Migration: 030_remove_unique_constraint_on_character_names.sql
-- Description: Remove unique constraint on character names to allow duplicate names
--              Names will still be unique per user, but multiple users can have characters with the same name

-- Drop the unique constraint on (user_id, name)
ALTER TABLE characters
DROP CONSTRAINT IF EXISTS characters_user_id_name_key;

-- Note: We're keeping the per-user uniqueness removed, but if you want to keep it per-user,
-- you would keep the constraint. However, the requirement is to allow non-unique names,
-- so we're removing it entirely.

COMMENT ON COLUMN characters.name IS 'Character name (max 20 alphanumeric chars, not unique)';

