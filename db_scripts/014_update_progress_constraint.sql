-- Migration: 014_update_progress_constraint.sql
-- Description: Update progress constraint to allow 0-200 (for scene generation phase tracking)
-- Created: 2024-12-30

-- Drop the existing constraint
ALTER TABLE storybooks DROP CONSTRAINT IF EXISTS storybooks_progress_check;

-- Add new constraint allowing 0-200
-- 0-95: Character generation phase
-- 100-200: Scene generation phase (UI subtracts 100 to display 0-100%)
ALTER TABLE storybooks ADD CONSTRAINT storybooks_progress_check CHECK (progress >= 0 AND progress <= 200);
