/** When true, pricing shows "FREE during Early Access" with strikethrough prices */
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
