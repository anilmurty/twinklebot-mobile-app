"use client"

import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Hook to detect if the user is on a mobile device
 * Uses Capacitor detection, user agent, and window width for accurate detection
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // If running inside Capacitor native shell, always mobile
    const checkCapacitor = () => {
      try {
        return Capacitor.isNativePlatform()
      } catch {
        return false
      }
    }

    // Check user agent for mobile devices
    const checkUserAgent = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      return mobileRegex.test(userAgent)
    }

    // Check window width (mobile typically < 768px)
    const checkWidth = () => {
      return window.innerWidth < 768
    }

    const updateIsMobile = () => {
      setIsMobile(checkCapacitor() || checkUserAgent() || checkWidth())
    }

    // Set initial value
    updateIsMobile()

    // Listen for resize events
    window.addEventListener('resize', updateIsMobile)

    return () => {
      window.removeEventListener('resize', updateIsMobile)
    }
  }, [])

  return isMobile
}

/**
 * Server-side utility to detect mobile from user agent
 * Use this in server components or API routes
 */
export function isMobileDevice(userAgent: string | null): boolean {
  if (!userAgent) return false
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  return mobileRegex.test(userAgent)
}
