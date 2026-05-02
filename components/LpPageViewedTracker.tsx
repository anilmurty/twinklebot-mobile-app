"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/utils/analytics"

// Module-scoped guard. A useRef-on-instance guard didn't survive whatever
// is causing the LP page to remount mid-visit (likely a React 19 + Next 16
// hydration / Suspense quirk). The TTL (30s) lets a legit re-entry from
// /app fire again, while collapsing back-to-back duplicate fires.
const FIRED = new Set<string>()
const TTL_MS = 30_000

export function LpPageViewedTracker({
  variant,
  slug,
}: {
  variant: string
  slug: string
}) {
  useEffect(() => {
    const key = `${variant}:${slug}`
    if (FIRED.has(key)) return
    FIRED.add(key)
    setTimeout(() => FIRED.delete(key), TTL_MS)
    trackEvent("lp_page_viewed", { lp_variant: variant, story_slug: slug })
  }, [variant, slug])
  return null
}
