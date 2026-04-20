/**
 * When true, pricing shows "FREE during Early Access" with strikethrough prices,
 * and new signups get 1 free premium credit (app code path).
 *
 * When setting this to false, also re-run db_scripts/005_create_profile_on_auth_trigger.sql
 * in the Supabase SQL editor to revert the handle_new_user trigger (removes automatic
 * 4-credit grant from the DB trigger path added in migration 062).
 */
export const IS_EARLY_ACCESS = true

/**
 * Landing page pricing plans (premium tier).
 * These mirror the subscription_plans table — update here when pricing changes.
 * Prices are in cents.
 */
export const LANDING_PAGE_PLANS = [
  { stories: 1, price_cents: 399 },
  { stories: 2, price_cents: 699 },
  { stories: 3, price_cents: 999 },
  { stories: 4, price_cents: 1299 },
]
