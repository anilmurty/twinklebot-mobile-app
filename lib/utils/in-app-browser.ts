/**
 * Detects whether the current page is being viewed inside a known
 * in-app browser (Facebook, Instagram, Twitter, LinkedIn, etc.).
 *
 * Why this matters: these embedded WebViews break Google OAuth.
 * Google blocks WebView-initiated OAuth flows for security and shows a
 * "Something went wrong" error. Users from these contexts must use
 * email/password signup instead.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined" || !navigator?.userAgent) return false
  const ua = navigator.userAgent
  // Order: Meta family (FB / IG / Threads), TikTok, Snapchat, X/Twitter,
  // LinkedIn, Line, Pinterest. All of these block Google OAuth.
  return /\bFBAN\b|\bFBAV\b|\bFB_IAB\b|Instagram|Threads|BareIosWebViewBridge|BytedanceWebview|musical_ly|Snapchat|Twitter|LinkedInApp|Line\/|Pinterest/i.test(ua)
}
