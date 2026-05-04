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
  return getInAppBrowserKind() !== null
}

export type InAppBrowserKind = "facebook" | "instagram" | "other"

/**
 * Identifies *which* in-app browser the user is in. We need to differentiate
 * Facebook from Instagram because:
 *   - Facebook in-app supports FB Login (session is shared with the FB app),
 *     so showing the FB Login button there is one-tap and works.
 *   - Instagram's WebView is a separate session even though both apps are
 *     Meta-owned. FB Login redirects loop after captcha because the post-
 *     login session cookie can't write back into the WebView. So in
 *     Instagram, FB Login is broken in practice and should be hidden too.
 */
export function getInAppBrowserKind(): InAppBrowserKind | null {
  if (typeof window === "undefined" || !navigator?.userAgent) return null
  const ua = navigator.userAgent
  if (/\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i.test(ua)) return "facebook"
  if (/Instagram|Threads/i.test(ua)) return "instagram"
  if (/BareIosWebViewBridge|BytedanceWebview|musical_ly|Snapchat|Twitter|LinkedInApp|Line\/|Pinterest/i.test(ua)) {
    return "other"
  }
  return null
}
