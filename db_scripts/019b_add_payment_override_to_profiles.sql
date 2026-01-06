-- Migration: 019b_add_payment_override_to_profiles.sql
-- Description: Add payment_override field to profiles table for free testing access
-- Created: 2024-01-01

-- Add payment_override column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS payment_override BOOLEAN DEFAULT false NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_payment_override ON profiles(payment_override);

-- Add comment explaining the field
COMMENT ON COLUMN profiles.payment_override IS 'If true, user bypasses payment gate and can generate stories for free. Used for testing and special promotions.';

