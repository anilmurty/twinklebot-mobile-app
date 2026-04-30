"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const GA_MEASUREMENT_ID = "G-J60V4T7WKW"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function GAPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined") return
    // Initialize dataLayer + gtag shim if not yet set up. The shim matches
    // the official Google snippet pattern (pushes the `arguments` object,
    // not a real array) so gtag.js processes queued entries correctly.
    window.dataLayer = window.dataLayer || []
    if (!window.gtag) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.gtag = function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    }
    const query = searchParams?.toString()
    const path = query ? `${pathname}?${query}` : pathname
    window.gtag!("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    })
  }, [pathname, searchParams])

  return null
}
