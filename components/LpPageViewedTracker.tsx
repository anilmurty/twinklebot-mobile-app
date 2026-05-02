"use client"

import { useEffect, useRef } from "react"
import { trackEvent } from "@/lib/utils/analytics"

/**
 * Fires lp_page_viewed exactly once per component instance.
 * The ref guard exists because the inline-script-pre-hydration approach
 * didn't fire reliably in production, and a plain useEffect was firing
 * twice (likely a React 19 / Next 16 hydration quirk).
 */
export function LpPageViewedTracker({
  variant,
  slug,
}: {
  variant: string
  slug: string
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackEvent("lp_page_viewed", { lp_variant: variant, story_slug: slug })
  }, [variant, slug])
  return null
}
