"use client"

import Link from "next/link"
import type { ComponentProps, MouseEvent } from "react"
import { trackEvent } from "@/lib/utils/analytics"

type LinkProps = ComponentProps<typeof Link>

interface TrackedLinkProps extends LinkProps {
  trackName?: string
  trackParams?: Record<string, string | number | boolean | undefined>
}

/**
 * Drop-in replacement for next/link that fires a GA4 event on click.
 * Use this from server components when you need conversion tracking on
 * a link without converting the whole page to a client component.
 */
export function TrackedLink({
  trackName = "cta_click",
  trackParams,
  onClick,
  ...rest
}: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    trackEvent(trackName, trackParams)
    onClick?.(e)
  }
  return <Link {...rest} onClick={handleClick} />
}
