"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/utils/analytics"

export function LpPageViewedTracker({
  variant,
  storySlug,
}: {
  variant: string
  storySlug: string
}) {
  useEffect(() => {
    trackEvent("lp_page_viewed", { lp_variant: variant, story_slug: storySlug })
  }, [variant, storySlug])

  return null
}
