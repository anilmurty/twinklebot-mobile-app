# Bundle Pricing Implementation

## Overview
Replace the current subscription-based pricing with a credits-based system where users purchase story credits (1, 2, 3, or 4) and can use them to unlock stories anytime. The UI will be streamlined to be more compact.

## Pricing Structure (Phase 1 - No Subscription)

| Plan | Price | Credits | Savings |
|------|-------|---------|---------|
| Single Storybook | $7.99 | 1 | - |
| 2-Story Bundle | $13.99 | 2 | ~12.5% |
| 3-Story Bundle | $19.99 | 3 | ~17% |
| 4-Story Bundle | $24.99 | 4 | ~22% |

## Database Changes

### Migration 036: Add story_credits to profiles
Add a `story_credits` column to the `profiles` table to track how many story credits a user has remaining.

### Migration 037: Seed bundle pricing plans
- Deactivate the current Monthly Subscription plan
- Update One-Time Purchase to Single Storybook ($7.99, 1 credit)
- Add 2-Story Bundle ($13.99, 2 credits)
- Add 3-Story Bundle ($19.99, 3 credits)  
- Add 4-Story Bundle ($24.99, 4 credits)

## Backend Changes

### Stripe webhook updates
On successful payment:
1. Add `stories_per_period` credits to the user's `story_credits`
2. If the user has a `preview_pending` storybook, automatically deduct 1 credit and trigger generation

### Storybook flow updates
- Check if user has available credits when completing a storybook
- If user has credits, deduct 1 and skip payment flow
- Add endpoint to get user's credit balance

## Frontend Changes

### Compact Pricing UI
- Simple radio list for plan selection
- Display price and credits clearly
- Highlight best value (4-Story Bundle)
- Messaging: "personalized keepsake", "yours forever"

### Credit balance display
When user has credits, show a simple "Use 1 of X credits" button instead of the pricing grid.

## User Flow

```
User generates preview
        │
        ▼
   Has credits?
    /        \
  Yes         No
   │           │
   ▼           ▼
"Use 1 of    Compact
X credits"   pricing UI
   │           │
   │           ▼
   │      Stripe checkout
   │           │
   │           ▼
   │      Add credits
   │           │
   └─────►─────┘
              │
              ▼
    Deduct 1 credit
              │
              ▼
    Generate full story
```

## Messaging Guidelines
- Emphasize "personalized keepsake," not just content
- Highlight that stories are owned forever
- Avoid language like "credits" or "unlimited" in user-facing copy
- Position bundles as convenience and value, not discounts

