"use client"

import Link from "next/link"
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react"
import { trackEvent } from "@/lib/utils/analytics"

// Module-scoped — dedupe story_card_visible events to once-per-slug per
// page session, even when the same slug appears multiple times (e.g. the
// homepage carousel duplicates its tile list for the infinite-scroll loop).
const reportedSlugs = new Set<string>()

type LinkProps = ComponentProps<typeof Link>

interface TrackedStoryTileProps extends Omit<LinkProps, "onClick"> {
  storySlug: string
  storyTitle: string
  visibleLocation: string
  clickLocation: string
  children: ReactNode
}

export function TrackedStoryTile({
  storySlug,
  storyTitle,
  visibleLocation,
  clickLocation,
  children,
  ...linkProps
}: TrackedStoryTileProps) {
  const ref = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (reportedSlugs.has(storySlug)) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !reportedSlugs.has(storySlug)) {
            reportedSlugs.add(storySlug)
            trackEvent("story_card_visible", {
              location: visibleLocation,
              story_slug: storySlug,
              label: storyTitle,
            })
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [storySlug, storyTitle, visibleLocation])

  const handleClick = () => {
    trackEvent("cta_click", {
      location: clickLocation,
      label: storyTitle,
      story_slug: storySlug,
      intent: "explore_story",
    })
  }

  return (
    <Link ref={ref} {...linkProps} onClick={handleClick}>
      {children}
    </Link>
  )
}
