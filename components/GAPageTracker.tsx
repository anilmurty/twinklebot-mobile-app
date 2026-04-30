"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const GA_MEASUREMENT_ID = "G-J60V4T7WKW"

export function GAPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return
    const query = searchParams?.toString()
    const path = query ? `${pathname}?${query}` : pathname
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_MEASUREMENT_ID,
    })
  }, [pathname, searchParams])

  return null
}
