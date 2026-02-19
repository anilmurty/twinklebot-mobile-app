# In-App Purchase Setup Guide

Complete setup guide for iOS and Android IAP using RevenueCat.

## Prerequisites

- **Apple Developer account** ($99/year) — https://developer.apple.com
- **Google Play Developer account** ($25 one-time) — https://play.google.com/console
- **RevenueCat account** (free tier, up to $2.5k/month revenue) — https://www.revenuecat.com

## Products to Create

All products are **consumable** one-time purchases (not subscriptions):

| Product ID | Credits | Price | Display Name |
|---|---|---|---|
| `com.twinklebot.story.single` | 1 | $7.99 | 1 Story Credit |
| `com.twinklebot.story.bundle2` | 2 | $13.99 | 2 Story Credits |
| `com.twinklebot.story.bundle3` | 3 | $18.99 | 3 Story Credits |
| `com.twinklebot.story.bundle4` | 4 | $22.99 | 4 Story Credits |

---

## Part 1: iOS — App Store Connect

### 1.1 Register the Bundle ID

1. Go to https://developer.apple.com/account
2. **Certificates, Identifiers & Profiles** > **Identifiers** > **+**
3. Select **App IDs** > **App**
4. Description: `Twinklebot`
5. Bundle ID (Explicit): `com.twinklebot.app`
6. Enable capabilities: **In-App Purchase** (should be on by default)
7. Click **Register**

### 1.2 Create the App in App Store Connect

1. Go to https://appstoreconnect.apple.com > **Apps** > **+** > **New App**
2. Fill in:
   - **Platform**: iOS
   - **Name**: Twinklebot
   - **Primary language**: English (U.S.)
   - **Bundle ID**: Select `com.twinklebot.app`
   - **SKU**: `twinklebot-ios`
3. Click **Create**

### 1.3 Create Consumable IAP Products

In App Store Connect, go to your app > **Monetization** > **In-App Purchases** > **+**

Create each one as **Consumable**:

#### Product 1: Single Story Credit
- **Type**: Consumable
- **Reference Name**: Single Story Credit
- **Product ID**: `com.twinklebot.story.single`
- **Price**: $7.99 (Tier 8)
- **Display Name**: 1 Story Credit
- **Description**: Create one personalized storybook starring your child
- **Review Notes**: Consumable credit used to generate a personalized children's storybook with AI-generated illustrations

#### Product 2: 2-Story Bundle
- **Type**: Consumable
- **Reference Name**: 2-Story Bundle
- **Product ID**: `com.twinklebot.story.bundle2`
- **Price**: $13.99 (Tier 14)
- **Display Name**: 2 Story Credits
- **Description**: Create two personalized storybooks starring your child
- **Review Notes**: Bundle of 2 consumable credits for generating personalized children's storybooks

#### Product 3: 3-Story Bundle
- **Type**: Consumable
- **Reference Name**: 3-Story Bundle
- **Product ID**: `com.twinklebot.story.bundle3`
- **Price**: $18.99 (Tier 19)
- **Display Name**: 3 Story Credits
- **Description**: Create three personalized storybooks starring your child
- **Review Notes**: Bundle of 3 consumable credits for generating personalized children's storybooks

#### Product 4: 4-Story Bundle
- **Type**: Consumable
- **Reference Name**: 4-Story Bundle
- **Product ID**: `com.twinklebot.story.bundle4`
- **Price**: $22.99 (Tier 23)
- **Display Name**: 4 Story Credits
- **Description**: Create four personalized storybooks starring your child
- **Review Notes**: Bundle of 4 consumable credits for generating personalized children's storybooks

> **Note**: Each product requires a screenshot of the purchase UI for review. You can add this later before submitting for review.

### 1.4 Create a Sandbox Tester

1. Go to **Users and Access** > **Sandbox** > **Testers** > **+**
2. Create a test account (use a fake email not linked to a real Apple ID)
3. This lets you test purchases without real charges

### 1.5 Generate App-Specific Shared Secret

1. In App Store Connect, go to your app > **General** > **App Information**
2. Scroll to **App-Specific Shared Secret** > **Manage**
3. Click **Generate** and copy the secret
4. You'll need this for RevenueCat setup

---

## Part 2: Android — Google Play Console

### 2.1 Create the App

1. Go to https://play.google.com/console > **All apps** > **Create app**
2. Fill in:
   - **App name**: Twinklebot
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept declarations, click **Create app**

### 2.2 Set Up Minimum Store Listing

Go to **Grow** > **Store presence** > **Main store listing**:

- **Short description**: "Personalized storybooks for your child"
- **Full description**: "Twinklebot creates magical, personalized storybooks starring your child. Upload a photo, choose a story, and watch as AI brings your child into beautifully illustrated adventures they'll treasure forever."
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2 phone screenshots
- **Category**: Education
- Save

### 2.3 Upload Initial Build (Required Before Creating IAP Products)

Google requires at least one APK/AAB uploaded before you can create in-app products.

```bash
# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:
1. **Build** > **Generate Signed Bundle / APK** > **Android App Bundle**
2. Create a new keystore or use an existing one
3. Build the AAB

Back in Google Play Console:
1. Go to **Testing** > **Internal testing** > **Create new release**
2. Upload the AAB
3. Add yourself as a tester
4. Submit for review

### 2.4 Create In-App Products

Go to **Monetize** > **In-app products** > **Create product**

Create each as a **managed product** (one-time, non-subscription):

#### Product 1
- **Product ID**: `com.twinklebot.story.single`
- **Name**: 1 Story Credit
- **Description**: Create one personalized storybook starring your child
- **Default price**: $7.99
- **Status**: Active

#### Product 2
- **Product ID**: `com.twinklebot.story.bundle2`
- **Name**: 2 Story Credits
- **Description**: Create two personalized storybooks starring your child
- **Default price**: $13.99
- **Status**: Active

#### Product 3
- **Product ID**: `com.twinklebot.story.bundle3`
- **Name**: 3 Story Credits
- **Description**: Create three personalized storybooks starring your child
- **Default price**: $18.99
- **Status**: Active

#### Product 4
- **Product ID**: `com.twinklebot.story.bundle4`
- **Name**: 4 Story Credits
- **Description**: Create four personalized storybooks starring your child
- **Default price**: $22.99
- **Status**: Active

### 2.5 Set Up License Testing

1. Go to **Settings** > **License testing**
2. Add your Gmail address as a license tester
3. This enables sandbox purchases (no real charges)

### 2.6 Create Google Play Service Account (for RevenueCat)

RevenueCat needs a service account to verify purchases:

1. Go to **Settings** > **API access**
2. Click **Link** to link to Google Cloud Console (if not already linked)
3. Click **Create new service account**
4. Follow the link to Google Cloud Console:
   - Create a service account with name like `revenuecat-twinklebot`
   - Grant role: **Pub/Sub Editor**
   - Create a JSON key and download it
5. Back in Google Play Console, click **Done** > **Grant access**
6. Grant the service account **Financial data** and **Manage orders and subscriptions** permissions

---

## Part 3: RevenueCat Configuration

### 3.1 Connect App Store (iOS)

1. In RevenueCat dashboard: **Apps & providers** (bottom left sidebar)
2. Click **+ New** > **Apple App Store**
3. Enter:
   - **App name**: Twinklebot iOS
   - **Bundle ID**: `com.twinklebot.app`
   - **App Store Connect Shared Secret**: (from step 1.5)

### 3.2 Connect Google Play Store (Android)

1. Click **+ New** > **Google Play Store**
2. Enter:
   - **App name**: Twinklebot Android
   - **Package name**: `com.twinklebot.app`
   - **Service Account JSON**: Upload the JSON key from step 2.6

### 3.3 Add Products

Go to **Product catalog** > **Products** tab > **+ New**

For each of the 4 products, add both the iOS and Android versions:

| Identifier | App Store Product ID | Play Store Product ID |
|---|---|---|
| `com.twinklebot.story.single` | `com.twinklebot.story.single` | `com.twinklebot.story.single` |
| `com.twinklebot.story.bundle2` | `com.twinklebot.story.bundle2` | `com.twinklebot.story.bundle2` |
| `com.twinklebot.story.bundle3` | `com.twinklebot.story.bundle3` | `com.twinklebot.story.bundle3` |
| `com.twinklebot.story.bundle4` | `com.twinklebot.story.bundle4` | `com.twinklebot.story.bundle4` |

### 3.4 Create Offering

Go to **Product catalog** > **Offerings** > **+ New offering**

- **Identifier**: `default` (must be exactly "default" — this is what the SDK fetches)
- **Display Name**: Story Credits

Add 4 packages:

| Package | Product |
|---|---|
| `single` | `com.twinklebot.story.single` |
| `bundle2` | `com.twinklebot.story.bundle2` |
| `bundle3` | `com.twinklebot.story.bundle3` |
| `bundle4` | `com.twinklebot.story.bundle4` |

### 3.5 Get API Keys

Go to **API keys** (bottom left sidebar):

- Copy the **Apple public API key** → this becomes `NEXT_PUBLIC_REVENUECAT_IOS_KEY`
- Copy the **Google public API key** → this becomes `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY`

> **Important**: Use the **public** keys, not the secret keys. The public keys are safe to include in client-side code.

### 3.6 Set Up Webhook

Go to **Integrations** (bottom left sidebar) > **Webhooks** > **+ New**

- **Webhook URL**: `https://www.twinklebot.app/api/v1/payments/revenuecat-webhook`
- **Authorization header**: Create a bearer token (e.g. generate a random string)
  - This becomes your `REVENUECAT_WEBHOOK_SECRET` environment variable
  - RevenueCat will send: `Authorization: Bearer <your-token>`
- **Events to send**: At minimum, enable:
  - `INITIAL_PURCHASE`
  - `NON_RENEWING_PURCHASE`

---

## Part 4: Environment Variables

Add these to your Vercel project settings and `.env.local`:

```
# RevenueCat - Public keys (safe for client-side)
NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx

# RevenueCat - Server-only (webhook verification)
REVENUECAT_WEBHOOK_SECRET=your-random-webhook-secret
```

---

## Part 5: Testing

### iOS Sandbox Testing
1. On your iPhone, go to **Settings** > **App Store** > **Sandbox Account**
2. Sign in with the sandbox tester from step 1.4
3. Run the app via Xcode, make a purchase — it will use sandbox mode automatically

### Android License Testing
1. Ensure your Gmail is added as a license tester (step 2.5)
2. Install the app from the internal testing track
3. Purchases will be in sandbox mode (no real charges)

### Webhook Testing
1. Make a sandbox purchase
2. Check RevenueCat dashboard > **Customers** to see the purchase event
3. Check your Vercel function logs to see the webhook received
4. Verify story credits were added to the user's profile in Supabase

---

## Code Files Reference

The IAP integration is implemented in these files:

| File | Purpose |
|---|---|
| `lib/utils/platform.ts` | `isNativeApp()`, `getPlatform()` utilities |
| `lib/services/iap-service.ts` | RevenueCat SDK wrapper |
| `lib/utils/capacitor-init.ts` | RevenueCat initialization on app start |
| `app/api/v1/payments/revenuecat-webhook/route.ts` | Server webhook — credits user, triggers generation |
| `lib/auth-context.tsx` | Identifies/logs out user in RevenueCat on auth changes |
| `components/compact-pricing.tsx` | Shows IAP prices when on native |
| `components/storybooks-tab.tsx` | IAP branch in resume purchase flow |
| `components/generate-story-dialog.tsx` | IAP branch in generate purchase flow |
| `components/create-story-dialog.tsx` | IAP branch in create purchase flow |
| `components/profile-tab.tsx` | "Restore Purchases" button (iOS requirement) |

## Purchase Flow (Native)

1. User taps "Continue to Payment" in any purchase dialog
2. `isNativeApp()` returns true → IAP branch
3. `getIAPPackages()` fetches offerings from RevenueCat
4. `purchasePackage()` opens native Apple/Google payment sheet
5. On success:
   - Client calls `storybooksApi.useCredit(storybookId)` to start generation immediately
   - RevenueCat sends webhook to our server
   - Server credits user's `profiles.story_credits` in Supabase
   - If there's a pending storybook, server auto-generates it
6. On cancel: nothing happens, user stays on payment screen
7. On error: error message displayed
