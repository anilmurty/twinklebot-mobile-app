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

export function trackAuthEvent(
  event: string,
  params?: Record<string, string | number | boolean | undefined> & { email?: string }
) {
  const { email, ...rest } = params ?? {}
  const enriched: Record<string, string | number | boolean | undefined> = { ...rest }
  if (email && typeof email === "string" && email.includes("@")) {
    enriched.email_domain = email.split("@")[1]
  }
  trackEvent(event, enriched)
}
