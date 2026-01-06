# Stripe Setup Guide for Testing

This guide will walk you through setting up Stripe for testing the payment flow in Twinklebot.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Supabase database
- Environment variables configured in your `.env.local` file

## Step 1: Create Stripe Account and Get API Keys

1. **Sign up for Stripe** (if you haven't already)
   - Go to https://stripe.com and create an account
   - Use test mode for development (toggle in top right)

2. **Get your API keys**
   - Navigate to: Developers → API keys
   - Copy your **Publishable key** (starts with `pk_test_...`)
   - Copy your **Secret key** (starts with `sk_test_...`)
   - ⚠️ Keep your secret key secure and never commit it to git

## Step 2: Create Products and Prices in Stripe

⚠️ **Important**: You need **TWO separate Stripe products** - one for one-time purchases and one for subscriptions. Do NOT try to mix one-time + recurring under the same Stripe price.

### Product 1: One-Time Purchase ($7.99)

**Stripe Type:** One-time Price

1. Go to: Products → Add product
2. Fill in:
   - **Name**: "Twinklebot Story – Single"
   - **Description**: "Purchase just this story without a subscription"
   - **Pricing model**: One time
   - **Price**: $7.99 USD
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_...`)
5. Copy the **Product ID** (starts with `prod_...`)

**Fulfillment**: Unlocks **only this story**

### Product 2: Monthly Subscription ($4.99/month)

**Stripe Type:** Recurring Price (monthly)

1. Go to: Products → Add product
2. Fill in:
   - **Name**: "Twinklebot Subscription"
   - **Description**: "A new adventure starring your child, every month"
   - **Pricing model**: Recurring
   - **Price**: $4.99 USD
   - **Billing period**: Monthly
3. Click **Save product**
4. Copy the **Price ID** (starts with `price_...`)
5. Copy the **Product ID** (starts with `prod_...`)

**Fulfillment**:
- Generates this story immediately
- Allows **1 new story per month**
- Cancel anytime

### Additional Plans (Optional)

You can create more plans as needed:
- Weekly subscription
- Bi-monthly subscription
- Annual subscription

Just follow the same pattern and note down the Price IDs and Product IDs.

## Step 3: Update Database Seed Script

1. Open `db_scripts/022_seed_subscription_plans.sql`
2. Replace the placeholder values:
   - `STRIPE_PRICE_ID_ONETIME` → Your one-time price ID
   - `STRIPE_PRODUCT_ID_ONETIME` → Your one-time product ID
   - `STRIPE_PRICE_ID_MONTHLY` → Your monthly subscription price ID
   - `STRIPE_PRODUCT_ID_MONTHLY` → Your monthly subscription product ID

Example:
```sql
INSERT INTO subscription_plans (
  name,
  description,
  stripe_price_id,
  stripe_product_id,
  plan_type,
  price_amount,
  currency,
  billing_interval,
  stories_per_period,
  is_active,
  display_order,
  features
) VALUES
  (
    'One-Time Purchase',
    'Purchase just this story without a subscription',
    'price_1234567890abcdef',  -- Replace with your actual price ID
    'prod_1234567890abcdef',   -- Replace with your actual product ID
    'one-time',
    799,
    'usd',
    NULL,
    1,
    true,
    1,
    '["Purchase just this story", "No subscription required", "One-time payment"]'::jsonb
  ),
  ...
```

3. Run the migration script in your Supabase SQL editor

## Step 5: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your app when payments are completed.

### For Local Development (using Stripe CLI)

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/payments/webhook
   ```
   
   This will output a webhook signing secret (starts with `whsec_...`)

4. **Copy the webhook secret** and add it to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### For Production

1. Go to: Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://your-domain.com/api/v1/payments/webhook`
3. **Events to send** (select these specific events):
   - `checkout.session.completed` ⭐ **Required** - Handles both one-time and subscription payments
   - `invoice.payment_succeeded` ⭐ **Required** - Grants monthly story credits for subscriptions
   - `customer.subscription.created` - Tracks new subscriptions
   - `customer.subscription.updated` - Handles subscription changes
   - `customer.subscription.deleted` ⭐ **Required** - Revokes future story credits when canceled
4. Click **Add endpoint**
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to your production environment variables

### Webhook Event Handling

Our webhook handler (`lib/stripe/webhooks.ts`) processes these events:

- **`checkout.session.completed`**: ⭐ **Currently Implemented**
  - If `mode === 'payment'`: Unlocks this story only
  - If `mode === 'subscription'`: Unlocks this story + marks user as subscribed
  
- **`invoice.payment_succeeded`**: ⚠️ **Recommended Addition**
  - Grants monthly story credit (resets `stories_used_this_period` for subscriptions)
  - Fires when subscription renews each month
  - Currently handled via `customer.subscription.updated`, but `invoice.payment_succeeded` is more specific
  
- **`customer.subscription.updated`**: ⭐ **Currently Implemented**
  - Updates subscription status and period dates
  
- **`customer.subscription.deleted`**: ⭐ **Currently Implemented**
  - Revokes future story credits but keeps already generated stories

**Note**: For production, consider adding explicit handling for `invoice.payment_succeeded` to reset monthly story credits when subscriptions renew. Currently, this is handled through subscription updates, but the invoice event is more explicit.

## Step 6: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

⚠️ **Important**: 
- Never commit `.env.local` to git
- Use `STRIPE_SECRET_KEY` (not `STRIPE_SECRET_KEY_TEST`)
- The `NEXT_PUBLIC_` prefix is required for client-side access

## Step 7: Install Stripe Packages

```bash
npm install stripe @stripe/stripe-js
```

Or if you're using pnpm:
```bash
pnpm install stripe @stripe/stripe-js
```

## Step 8: Run Database Migrations

Run the migrations in order:

1. `019_add_preview_pending_and_payment_fields.sql`
2. `019b_add_payment_override_to_profiles.sql`
3. `020_create_subscription_plans_table.sql`
4. `021_create_subscriptions_table.sql`
5. `022_seed_subscription_plans.sql` (after updating with your Stripe IDs)

You can run these in the Supabase SQL editor or via your migration tool.

## Step 8: Understanding the Checkout Flow

### Button → Checkout Mapping

| UI Button                           | Stripe Mode          | What Happens                    |
| ----------------------------------- | -------------------- | ------------------------------- |
| **Subscribe & Generate Full Story** | `mode: subscription` | Creates subscription + unlocks story |
| **Purchase & Generate Full Story**  | `mode: payment`      | One-time payment + unlocks story |

Both buttons use **Stripe Checkout** but with different modes. The webhook handler (`checkout.session.completed`) checks the `mode` field to determine how to fulfill the purchase.

### UX Copy Suggestions

For better conversion, consider these copy tweaks:

**Instead of:**
> "Subscribe & Generate Full Story"

**Try:**
> "Generate This Story + Monthly Adventures"

This emphasizes immediate value + future value, which parents respond better to.

**Keep "Cancel anytime" visible** but not dominant - parents already assume subscriptions are scary, so don't make it the main focus.

## Step 9: Test the Integration

### Test Cards (Stripe Test Mode)

Stripe provides test card numbers for testing:

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure):**
- Card: `4000 0025 0000 3155`

**More test cards**: https://stripe.com/docs/testing

### Testing Flow

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (if testing locally)
   ```bash
   stripe listen --forward-to localhost:3000/api/v1/payments/webhook
   ```

3. **Test the payment flow**:
   - Create a character
   - Start creating a story
   - Preview should generate
   - Payment gate should appear
   - Select a plan
   - Use test card `4242 4242 4242 4242`
   - Complete checkout
   - Webhook should trigger and resume story generation

### Testing Payment Override

To test the payment override feature:

1. Open Supabase SQL editor
2. Run:
   ```sql
   UPDATE profiles
   SET payment_override = true
   WHERE id = 'your-user-id';
   ```
3. Create a story - it should skip payment and go straight to generation

### Testing Coupon Codes

1. Go to: Products → Coupons → Create coupon
2. Set:
   - **Code**: `TEST50` (or any code you want)
   - **Discount**: 50% off (or fixed amount)
   - **Duration**: Once or Forever
3. Click **Create coupon**
4. Use the coupon code in the payment gate

## Troubleshooting

### Webhook Not Receiving Events

- **Check webhook endpoint URL** is correct
- **Verify webhook secret** matches in environment variables
- **Check Stripe CLI** is running (for local testing)
- **View webhook logs** in Stripe Dashboard → Developers → Webhooks

### Payment Not Completing

- **Check browser console** for errors
- **Verify Stripe keys** are correct (test vs live mode)
- **Check network tab** for failed API calls
- **Review Stripe Dashboard** → Payments for error details

### Story Not Resuming After Payment

- **Check webhook logs** in Stripe Dashboard
- **Verify webhook secret** is correct
- **Check server logs** for webhook processing errors
- **Ensure storybook status** is `preview_pending` before payment

### Coupon Not Working

- **Verify coupon code** is active in Stripe Dashboard
- **Check coupon validation** endpoint logs
- **Ensure coupon code** matches exactly (case-sensitive)

## Test Mode vs Live Mode

- **Test Mode**: Use for development and testing
  - Test cards work
  - No real charges
  - Test webhook events
  - Keys start with `pk_test_` and `sk_test_`

- **Live Mode**: Use for production
  - Real payments
  - Real charges
  - Production webhooks
  - Keys start with `pk_live_` and `sk_live_`

⚠️ **Switch to Live Mode** only when ready for production!

## Important: App Store Considerations (Future iOS)

⚠️ **If you plan to ship on iOS App Store:**

Apple **will not allow** this Stripe paywall inside the app. You must:

- Use **Apple In-App Purchases (IAP)** for in-app payments, OR
- Push payments to web (account creation outside the app)

Your current setup is **perfect for web** and will work great for:
- Web app
- Android (Google Play allows third-party payments)
- Progressive Web App (PWA)

For iOS, you'll need to:
1. Use Apple's IAP system for in-app purchases
2. Or redirect users to your web app for payment

Plan ahead if iOS is in your roadmap!

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Apple In-App Purchase Guidelines](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)

## Support

If you encounter issues:
1. Check Stripe Dashboard → Logs for errors
2. Review server logs for webhook processing
3. Verify all environment variables are set correctly
4. Ensure database migrations have been run
5. Check webhook event logs in Stripe Dashboard → Developers → Webhooks

