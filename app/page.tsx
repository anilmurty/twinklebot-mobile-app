"use client"

import { useState, useEffect, Suspense } from "react"
import { StorybooksTab } from "@/components/storybooks-tab"
import { CharactersTab } from "@/components/characters-tab"
import { StoryLibraryTab } from "@/components/story-library-tab"
import { ProfileTab } from "@/components/profile-tab"
import { BottomNav } from "@/components/bottom-nav"
import { LandingPage } from "@/components/landing-page"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"

function HomeContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"storybooks" | "characters" | "library" | "profile">("storybooks")

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'profile'].includes(tab)) {
      setActiveTab(tab as typeof activeTab)
    }
  }, [searchParams])

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

  return (
    <main className="h-screen flex flex-col bg-background pb-16 overflow-hidden">
      <div className="flex-1 overflow-auto">
        {activeTab === "storybooks" && <StorybooksTab />}
        {activeTab === "characters" && <CharactersTab />}
        {activeTab === "library" && <StoryLibraryTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
