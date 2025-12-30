-- Migration 015: Make left_photo_url and right_photo_url nullable
-- Since we only use front_photo_url now, these fields are no longer required

-- Check if table exists before altering
DO $$
BEGIN
  -- Check if characters table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'characters'
  ) THEN
    -- Make left_photo_url and right_photo_url nullable if they have NOT NULL constraint
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'characters' 
      AND column_name = 'left_photo_url'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE characters ALTER COLUMN left_photo_url DROP NOT NULL;
    END IF;

    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'characters' 
      AND column_name = 'right_photo_url'
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE characters ALTER COLUMN right_photo_url DROP NOT NULL;
    END IF;

    -- Set existing empty strings to NULL for cleaner data
    UPDATE characters 
    SET left_photo_url = NULL 
    WHERE left_photo_url = '';

    UPDATE characters 
    SET right_photo_url = NULL 
    WHERE right_photo_url = '';
  END IF;
END $$;

