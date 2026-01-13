"use client"

import { Suspense } from "react"
import { WebLandingPage } from "@/components/web-landing-page"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function HomeContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // If user is authenticated, redirect to /app
  useEffect(() => {
    if (!loading && user) {
      router.replace("/app")
    }
  }, [user, loading, router])

  // Show loading while checking auth or redirecting
  if (loading || user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-amber-800/60">Loading...</p>
        </div>
      </div>
    )
  }

  return <WebLandingPage />
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-amber-800/60">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
