"use client"

import { useState, useEffect, Suspense } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { DesktopLayout } from "@/components/desktop-layout"
import { LandingPage } from "@/components/landing-page"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"
import { useIsMobile } from "@/lib/utils/device-detection"
import { isDesignMode } from "@/lib/designMode"

function AppContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<"storybooks" | "characters" | "library" | "profile">("storybooks")

  // ✅ DESIGN_MODE: Use centralized design mode check
  const designMode = isDesignMode()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'profile'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

  // ✅ DESIGN_MODE: In design mode, always show app UI (bypass auth check)
  // This allows v0.dev to preview the app without requiring authentication
  if (designMode) {
    // Render mobile or desktop layout based on device detection
    if (isMobile) {
      return <MobileLayout activeTab={activeTab} onTabChange={setActiveTab} />
    } else {
      return <DesktopLayout activeTab={activeTab} onTabChange={setActiveTab} />
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  // Render mobile or desktop layout based on device detection
  if (isMobile) {
    return <MobileLayout activeTab={activeTab} onTabChange={setActiveTab} />
  } else {
    return <DesktopLayout activeTab={activeTab} onTabChange={setActiveTab} />
  }
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AppContent />
    </Suspense>
  )
}


