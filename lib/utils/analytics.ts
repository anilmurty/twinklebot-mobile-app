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

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/**
 * Sanitize an error message before sending it to GA4.
 * - Replaces anything that looks like an email with "[email]"
 *   (defense in depth — Supabase occasionally echoes user input).
 * - Truncates to 80 characters so we never accidentally ship a payload.
 */
function sanitizeErrorMessage(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  return raw.replace(EMAIL_PATTERN, "[email]").slice(0, 80)
}

export type AuthErrorStep =
  | "oauth_launch"
  | "oauth_callback"
  | "email_signin"
  | "email_signup"
  | "session_refresh"
  | "post_auth_intent"

export function trackAuthError(params: {
  step: AuthErrorStep
  method?: string
  error_code?: string
  error_message?: string
}) {
  trackEvent("auth_error", {
    step: params.step,
    method: params.method,
    error_code: params.error_code,
    error_message: sanitizeErrorMessage(params.error_message),
  })
}
