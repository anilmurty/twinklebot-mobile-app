/**
 * Lightweight GA4 event tracking utility.
 * gtag is initialized in app/layout.tsx with measurement ID G-J60V4T7WKW.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === "undefined" || !window.gtag) return
  // Filter out undefined values
  const clean: Record<string, string | number | boolean> = {}
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) clean[k] = v
    }
  }
  window.gtag("event", eventName, clean)
}
