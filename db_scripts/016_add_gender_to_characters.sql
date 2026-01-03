-- Migration 016: Add gender column to characters table
-- Gender is required and can be 'male' or 'female'

-- Add gender column (nullable initially for existing records)
ALTER TABLE characters 
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- Set a default value for existing records (you may want to update these manually)
-- For now, we'll set a default to allow the NOT NULL constraint
UPDATE characters 
SET gender = 'male' 
WHERE gender IS NULL;

-- Make gender required (NOT NULL)
ALTER TABLE characters 
  ALTER COLUMN gender SET NOT NULL;
