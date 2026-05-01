"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/utils/analytics"

/**
 * Fires a `story_page_viewed` GA4 event with the slug as a parameter so we can
 * slice landing-page funnels by story in standard reports / Explorations.
 * GA4's auto page_view event doesn't accept custom params, hence this companion.
 */
export function StoryPageViewedTracker({ storySlug }: { storySlug: string }) {
  useEffect(() => {
    trackEvent("story_page_viewed", { story_slug: storySlug })
  }, [storySlug])

  return null
}
