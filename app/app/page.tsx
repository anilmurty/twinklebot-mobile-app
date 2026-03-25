"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { DesktopLayout } from "@/components/desktop-layout"
import { LandingPage } from "@/components/landing-page"
import { SplashScreen } from "@/components/splash-screen"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"
import { useIsMobile } from "@/lib/utils/device-detection"
import { isDesignMode } from "@/lib/designMode"
import { usePrefetch } from "@/lib/hooks/use-prefetch"

function AppContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<"storybooks" | "characters" | "library" | "keepsakes" | "profile">("storybooks")
  const [splashDismissed, setSplashDismissed] = useState(false)

  const designMode = isDesignMode()
  const dataReady = usePrefetch(!loading && !!user)
  const showSplash = !designMode && (loading || (!!user && !dataReady))

  const handleFadeComplete = useCallback(() => {
    setSplashDismissed(true)
  }, [])

  // Reset to storybooks tab when user changes (new sign-in)
  useEffect(() => {
    if (user) {
      setActiveTab("storybooks")
    }
  }, [user?.id])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'keepsakes', 'profile'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

  // Design mode: bypass auth, no splash
  if (designMode) {
    if (isMobile) {
      return <MobileLayout activeTab={activeTab} onTabChange={setActiveTab} />
    } else {
      return <DesktopLayout activeTab={activeTab} onTabChange={setActiveTab} />
    }
  }

  // Auth still loading — show splash only
  if (loading) {
    return <SplashScreen visible={true} />
  }

  // No user — landing page immediately
  if (!user) {
    return <LandingPage />
  }

  // User exists — render app layout with splash overlay on top while data loads
  const layout = isMobile
    ? <MobileLayout activeTab={activeTab} onTabChange={setActiveTab} />
    : <DesktopLayout activeTab={activeTab} onTabChange={setActiveTab} />

  return (
    <>
      {layout}
      {!splashDismissed && (
        <SplashScreen visible={showSplash} onFadeComplete={handleFadeComplete} />
      )}
    </>
  )
}

export default function AppPage() {
  return (
    <Suspense fallback={<SplashScreen visible={true} />}>
      <AppContent />
    </Suspense>
  )
}
