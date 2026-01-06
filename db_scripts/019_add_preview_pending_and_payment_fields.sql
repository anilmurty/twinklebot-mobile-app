-- Migration: 019_add_preview_pending_and_payment_fields.sql
-- Description: Add preview_pending status and payment fields to storybooks table
-- Created: 2024-01-01

-- Add preview_pending to status CHECK constraint
ALTER TABLE storybooks
DROP CONSTRAINT IF EXISTS storybooks_status_check;

ALTER TABLE storybooks
ADD CONSTRAINT storybooks_status_check 
CHECK (status IN ('pending', 'preview_pending', 'generating', 'completed', 'failed'));

-- Add payment-related fields
ALTER TABLE storybooks
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_coupon_code TEXT;

-- Add index on payment_status for faster queries
CREATE INDEX IF NOT EXISTS idx_storybooks_payment_status ON storybooks(payment_status);

-- Add index on stripe_checkout_session_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_storybooks_stripe_checkout_session_id ON storybooks(stripe_checkout_session_id);

-- Add comment explaining preview_pending status
COMMENT ON COLUMN storybooks.status IS 'Generation status: pending (queued), preview_pending (preview generated, awaiting payment), generating (in progress), completed (done), failed (error)';

