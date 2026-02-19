import { Capacitor } from '@capacitor/core'

/**
 * Navigate to a URL, handling external URLs in native context.
 * - Internal URLs (same origin): uses window.location.href (stays in WebView)
 * - External URLs (different origin): opens in system browser on native,
 *   or window.location.href on web
 */
export async function navigateToUrl(url: string) {
  const isExternal = url.startsWith('http') && !url.startsWith(window.location.origin)

  if (isExternal && Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } else {
    window.location.href = url
  }
}
