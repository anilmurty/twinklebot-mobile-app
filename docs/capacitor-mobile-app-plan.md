# Capacitor Mobile App: iOS & Android via Live URL + IAP

## Context
Twinklebot is a Next.js 16 web app deployed on Vercel with full responsive mobile support (MobileLayout + DesktopLayout switching via `useIsMobile()`). We want to ship native iOS and Android apps using **Capacitor in live URL mode** — the native shell loads the existing Vercel deployment in a WebView. Payments inside the native apps will use **Apple/Google In-App Purchases via RevenueCat** (required by App Store policies for digital goods).

---

## Phase 1: Capacitor Project Setup

### Install dependencies
```
pnpm add @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### Create `capacitor.config.ts` (new file)
- `appId`: `com.twinklebot.app`
- `appName`: `Twinklebot`
- `server.url`: production Vercel URL (e.g. `https://www.twinklebot.app`)
- `webDir`: `public` (required by CLI but unused in live URL mode)

### Initialize platforms
```
npx cap add ios
npx cap add android
```
Creates `ios/` and `android/` directories with native projects.

### Update existing files
- `package.json` — add scripts: `cap:sync`, `cap:open:ios`, `cap:open:android`
- `tsconfig.json` — add `ios` and `android` to `exclude` array
- `.gitignore` — add native build artifacts (`ios/App/Pods/`, `android/.gradle/`, `android/build/`, etc.) but keep `ios/` and `android/` tracked

---

## Phase 2: Safe Area & Native UI Polish

### `app/layout.tsx`
- Add `viewportFit: "cover"` to the existing `viewport` export (enables `env(safe-area-inset-*)` CSS values)
- Add `<CapacitorInitializer />` component inside `<body>` alongside existing providers

### `app/globals.css`
- Add safe area CSS custom properties:
  ```css
  @supports (padding: env(safe-area-inset-top)) {
    :root {
      --safe-area-top: env(safe-area-inset-top);
      --safe-area-bottom: env(safe-area-inset-bottom);
    }
  }
  ```

### `components/bottom-nav.tsx`
- Add `pb-[env(safe-area-inset-bottom)]` to the `<nav>` so it doesn't hide behind the iPhone home indicator

### `components/mobile-layout.tsx`
- Add top safe area padding (status bar / notch): `pt-[env(safe-area-inset-top)]`
- Update bottom padding from `pb-16` to `calc(4rem + env(safe-area-inset-bottom))`

### `components/landing-page.tsx`
- Add safe area top padding to the brand area so it sits below the status bar

### New files
- `components/capacitor-initializer.tsx` — `"use client"` component that calls `initCapacitor()` on mount
- `lib/utils/capacitor-init.ts` — status bar styling via `@capacitor/status-bar` (light style, background color matching app theme `#FAFAF5`)

### Install
```
pnpm add @capacitor/status-bar
```

---

## Phase 3: Auth Flow for Native

Google blocks OAuth in embedded WebViews. Solution: open OAuth in the **system browser** (Safari/Chrome), then deep link back to the app.

### Install
```
pnpm add @capacitor/browser @capacitor/app
```

### `lib/auth-context.tsx`
- Modify `signInWithGoogle()`:
  - If `Capacitor.isNativePlatform()`: use `signInWithOAuth` with `skipBrowserRedirect: true` + `redirectTo: 'twinklebot://auth/callback'`, then open the returned URL with `@capacitor/browser`
  - If web: existing flow unchanged
- In `onAuthStateChange` handler: identify/logout user in RevenueCat (Phase 4)
- Call `setupDeepLinkHandler(supabase)` during initialization

### New file: `lib/utils/deep-link-handler.ts`
- Listen for `appUrlOpen` events from `@capacitor/app`
- When `twinklebot://auth/callback?code=...` is received, call `supabase.auth.exchangeCodeForSession(code)` and close the system browser

### Native project configuration
- **iOS** `Info.plist`: add `CFBundleURLSchemes` with `twinklebot`
- **Android** `AndroidManifest.xml`: add intent filter for `twinklebot://` scheme
- **Supabase dashboard**: add `twinklebot://auth/callback` to allowed redirect URLs

---

## Phase 4: In-App Purchases (RevenueCat)

### Why RevenueCat
- Single API for iOS + Android
- Built-in receipt validation (no custom Apple/Google server verification)
- Webhooks to credit purchases server-side
- Free tier covers up to $2.5k/month revenue

### External service setup (manual, not code)
1. Create RevenueCat account, connect App Store Connect + Google Play Console
2. Create IAP products in App Store Connect & Google Play Console:
   - `com.twinklebot.story.single` — 1 credit
   - `com.twinklebot.story.bundle2` — 2 credits
   - `com.twinklebot.story.bundle3` — 3 credits
   - `com.twinklebot.story.bundle4` — 4 credits
3. Create Offerings + Packages in RevenueCat mapping to the above
4. Configure RevenueCat webhook → `https://www.twinklebot.app/api/v1/payments/revenuecat-webhook`

### Install
```
pnpm add @revenuecat/purchases-capacitor
```

### New files
- `lib/utils/platform.ts` — `isNativeApp()` and `getPlatform()` using `Capacitor.isNativePlatform()` / `Capacitor.getPlatform()`
- `lib/services/iap-service.ts` — wrapper around RevenueCat: `getIAPPackages()` (fetch offerings) and `purchasePackage()` (trigger purchase flow)
- `app/api/v1/payments/revenuecat-webhook/route.ts` — receives purchase events from RevenueCat, credits story credits to user's profile in Supabase

### Modified files — payment flow branching
In these three files, the purchase handler needs an `if (isNativeApp())` branch:
- `components/storybooks-tab.tsx` — resume purchase flow
- `components/generate-story-dialog.tsx` — complete purchase flow
- `components/create-story-dialog.tsx` — complete purchase flow

**Native branch:** call `purchasePackage()` → on success, call `storybooksApi.useCredit(storybookId)` → navigate to storybooks
**Web branch:** existing Stripe checkout flow (unchanged)

### `components/compact-pricing.tsx`
- Support an optional `priceString` prop (e.g. "$7.99" from RevenueCat in local currency) that overrides the computed Stripe price when in native

### `components/profile-tab.tsx`
- Add "Restore Purchases" button (iOS App Store requirement) when `isNativeApp()`, calling `Purchases.restorePurchases()`

### `lib/utils/capacitor-init.ts`
- Add RevenueCat initialization: `Purchases.configure({ apiKey })` using platform-specific API keys

### Environment variables
- `NEXT_PUBLIC_REVENUECAT_IOS_KEY` — RevenueCat public iOS key
- `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY` — RevenueCat public Android key
- `REVENUECAT_WEBHOOK_SECRET` — server-only, for webhook verification

---

## Phase 5: External URL Handling

### New file: `lib/utils/navigation.ts`
- `navigateToUrl(url)` — if external URL + native platform → open in system browser via `@capacitor/browser`; otherwise → `window.location.href`

### Modified files
Replace `window.location.href = checkout.checkout_url` in the Stripe paths (safety net for web fallback on native):
- `components/storybooks-tab.tsx`
- `components/generate-story-dialog.tsx`
- `components/create-story-dialog.tsx`

Also wire up the Profile tab's Privacy Policy / Terms of Service / Help buttons to open external URLs properly.

---

## Phase 6: Device Detection

### `lib/utils/device-detection.ts`
- Add `Capacitor.isNativePlatform()` check to `useIsMobile()` — if running in Capacitor, always return `true` so the app uses MobileLayout

---

## Phase 7: App Store Assets & Submission

### App icons
- Generate 1024x1024 PNG from Twinklebot logo (current `public/logo.png` is only 180x180)
- iOS: place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: generate adaptive icon layers in `android/app/src/main/res/mipmap-*/`

### Splash screens
- iOS: customize `ios/App/App/Base.lproj/LaunchScreen.storyboard` with brand colors (#FAFAF5) + logo
- Android: install `@capacitor/splash-screen`, configure in `capacitor.config.ts`

### Store metadata
- **App Store Connect**: name, subtitle, category (Education), age rating (4+), screenshots (iPhone, iPad), description, privacy URL, support URL
- **Google Play Console**: same + feature graphic (1024x500), content rating questionnaire

### Legal requirements
- Privacy Policy page (required — especially important since app involves children's photos, must address COPPA)
- Terms of Service page
- Create routes at `/privacy` and `/terms` on the Vercel app, or host externally

### App Store review considerations
- The IAP integration, native status bar, safe area handling, and proper MobileLayout help avoid "thin WebView wrapper" rejection
- Consider adding `@capacitor/haptics` for tactile feedback and `@capacitor/push-notifications` for future engagement features — both strengthen the "native app" case

---

## New Files Summary
| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor project config (live URL mode) |
| `lib/utils/platform.ts` | `isNativeApp()`, `getPlatform()` |
| `lib/utils/capacitor-init.ts` | Status bar + RevenueCat initialization |
| `lib/utils/deep-link-handler.ts` | OAuth deep link callback handling |
| `lib/utils/navigation.ts` | External URL navigation helper |
| `lib/services/iap-service.ts` | RevenueCat IAP wrapper |
| `components/capacitor-initializer.tsx` | Client component to run init on mount |
| `app/api/v1/payments/revenuecat-webhook/route.ts` | RevenueCat webhook → credit user |
| `ios/` | Xcode project (generated) |
| `android/` | Android Studio project (generated) |

## Modified Files Summary
| File | Changes |
|------|---------|
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | Exclude `ios/`, `android/` |
| `.gitignore` | Native build artifacts |
| `app/layout.tsx` | `viewportFit: "cover"`, `<CapacitorInitializer />` |
| `app/globals.css` | Safe area CSS properties |
| `components/bottom-nav.tsx` | Safe area bottom padding |
| `components/mobile-layout.tsx` | Safe area top + bottom padding |
| `components/landing-page.tsx` | Safe area top padding |
| `lib/auth-context.tsx` | Native OAuth, RevenueCat user ID, deep links |
| `lib/utils/device-detection.ts` | Capacitor detection in `useIsMobile()` |
| `components/storybooks-tab.tsx` | IAP branch in purchase flow |
| `components/generate-story-dialog.tsx` | IAP branch in purchase flow |
| `components/create-story-dialog.tsx` | IAP branch in purchase flow |
| `components/compact-pricing.tsx` | IAP price string support |
| `components/profile-tab.tsx` | Restore Purchases button, external links |

## Implementation Order
1. Phase 1 (Capacitor setup) — get the native shell running
2. Phase 2 (Safe areas) — make it look correct on device
3. Phase 6 (Device detection) — quick win
4. Phase 3 (Auth) — app becomes usable on native
5. Phase 5 (External URLs) — safety net
6. Phase 4 (IAP) — most complex, requires external service setup
7. Phase 7 (Store assets + submission)

## Verification
1. `npx next build` succeeds (no regressions to web)
2. iOS simulator: app loads Vercel URL, shows MobileLayout, safe areas respected
3. Android emulator: same
4. Google OAuth: opens system browser, authenticates, deep links back to app with session
5. IAP: sandbox purchase completes, RevenueCat webhook fires, story credits appear in profile
6. Stripe web flow still works unchanged on desktop/mobile web
7. Share links, storybook reading, all existing features work in WebView
