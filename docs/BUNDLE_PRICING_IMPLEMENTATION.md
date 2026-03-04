# Bundle Pricing Implementation

## Overview
Credits-based system where users purchase story credits (1, 2, 3, or 4) and can use them to unlock stories anytime. Two quality tiers: **Basic** (nano-banana model) and **Premium** (nano-banana-pro model).

## Pricing Structure (Phase 1 - No Subscription)

### Basic Tier
| Plan | Price | Credits | Savings |
|------|-------|---------|---------|
| Single Storybook | $0.99 | 1 | - |
| 2-Story Bundle | $1.49 | 2 | ~25% |
| 3-Story Bundle | $1.99 | 3 | ~33% |
| 4-Story Bundle | $2.49 | 4 | ~37% |

### Premium Tier
| Plan | Price | Credits | Savings |
|------|-------|---------|---------|
| Single Storybook | $3.99 | 1 | - |
| 2-Story Bundle | $6.99 | 2 | ~12% |
| 3-Story Bundle | $9.99 | 3 | ~17% |
| 4-Story Bundle | $12.99 | 4 | ~19% |

## Quality Tiers

- **Basic**: Uses `google/nano-banana` model. Cheaper, good quality.
- **Premium**: Uses `google/nano-banana-pro` model. Higher quality AI images.
- Preview generation always uses the **basic** model regardless of tier.
- When a user purchases premium, scene 1 (the preview scene) is **regenerated** with the pro model before generating the remaining scenes.
- The `NANOBANANA_MODEL_VERSION` env var overrides all tier logic (for testing/debugging).

## Database Changes

### Migration 036: Add story_credits to profiles
Add a `story_credits` column to the `profiles` table (legacy, replaced by tier-specific columns).

### Migration 037: Seed bundle pricing plans
- Deactivate subscription plans, add one-time purchase bundles (original single-tier pricing).

### Migration 038: Add quality tier columns
- Add `basic_credits` and `premium_credits` INTEGER columns to `profiles` (default 0)
- Migrate existing `story_credits` → `basic_credits`
- Add `quality_tier` TEXT column to `storybooks` ('basic' or 'premium', nullable)
- Add `quality_tier` TEXT column to `subscription_plans` (default 'basic')

### Migration 039: Seed tier pricing plans
- Update existing plans: set `quality_tier = 'basic'`, update prices and Stripe IDs
- Insert 4 premium plans with their Stripe IDs

## Backend Changes

### Model selection (`lib/services/image-generation.ts`)
- `getModelIdentifier()` accepts `qualityTier` parameter
- Priority: env var override > quality tier > template model > default (nano-banana)

### Storybook generator (`lib/services/storybook-generator.ts`)
- Reads `quality_tier` from storybook record
- Passes tier to all `createBasePhotoAndCharacterPrediction()` calls
- **Premium regeneration**: if premium and resuming from preview, regenerates scene 1 with pro model

### Preview generator (`lib/services/preview-generator.ts`)
- Always passes `'basic'` tier (preview is always basic quality)

### Use-credit endpoint (`app/api/v1/storybooks/[id]/use-credit/route.ts`)
- Accepts `quality_tier` in request body (default 'basic')
- Deducts from `basic_credits` or `premium_credits`
- Sets `quality_tier` on storybook record

### Stripe checkout & webhooks
- `quality_tier` passed through checkout session metadata
- Webhook credits correct pool (`basic_credits` or `premium_credits`)
- Sets `quality_tier` on storybook

### RevenueCat webhook
- Product map includes legacy IDs (basic), new `.basic.*` IDs, and `.premium.*` IDs
- Credits correct pool based on product tier

### Profile API
- Returns `basic_credits` and `premium_credits` alongside legacy `story_credits`

## Frontend Changes

### Compact Pricing UI (`components/compact-pricing.tsx`)
- Basic/Premium tier toggle at top
- Plans filtered by selected tier
- Credit count shown for selected tier
- "Use Credit" passes tier to API

### Generate Story Dialog & Storybooks Tab
- `selectedTier` state tracks user's tier choice
- Both credit types fetched and displayed
- Plans filtered by tier
- Tier passed to `useCredit()` and payment flows

### IAP Service (`lib/services/iap-service.ts`)
- `IAPPackage` includes `tier` field
- Product map supports legacy, basic, and premium product IDs

## User Flow

```
User generates preview (always basic model)
        │
        ▼
   Select tier: Basic / Premium
        │
        ▼
   Has credits for tier?
    /        \
  Yes         No
   │           │
   ▼           ▼
"Use 1        Tier-filtered
credit"       pricing UI
   │           │
   │           ▼
   │      Payment (Stripe/IAP)
   │           │
   │           ▼
   │      Add credits to tier pool
   │           │
   └─────►─────┘
              │
              ▼
    Deduct 1 credit from tier pool
    Set quality_tier on storybook
              │
              ▼
    If premium: regenerate scene 1 with pro model
    Generate remaining scenes with tier model
```

## Messaging Guidelines
- Emphasize "personalized keepsake," not just content
- Highlight that stories are owned forever
- Premium tier: "Higher quality AI images"
- Position bundles as convenience and value, not discounts

