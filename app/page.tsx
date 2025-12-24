"use client"

import { useState } from "react"
import { StorybooksTab } from "@/components/storybooks-tab"
import { CharactersTab } from "@/components/characters-tab"
import { StoryLibraryTab } from "@/components/story-library-tab"
import { ProfileTab } from "@/components/profile-tab"
import { BottomNav } from "@/components/bottom-nav"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<"storybooks" | "characters" | "library" | "profile">("storybooks")

  if (!isLoggedIn) {
    return <LandingPage onLogin={() => setIsLoggedIn(true)} />
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
