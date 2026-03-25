"use client"

import { StorybooksTab } from "@/components/storybooks-tab"
import { CharactersTab } from "@/components/characters-tab"
import { StoryLibraryTab } from "@/components/story-library-tab"
import { ProfileTab } from "@/components/profile-tab"
import { KeepsakesTab } from "@/components/keepsakes-tab"
import { BottomNav } from "@/components/bottom-nav"
import { MobileHeader } from "@/components/mobile-header"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface MobileLayoutProps {
  activeTab: "storybooks" | "characters" | "library" | "keepsakes" | "profile"
  onTabChange: (tab: "storybooks" | "characters" | "library" | "keepsakes" | "profile") => void
}

export function MobileLayout({ activeTab, onTabChange }: MobileLayoutProps) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'keepsakes', 'profile'].includes(tab)) {
      onTabChange(tab as typeof activeTab)
    }
  }, [searchParams, onTabChange])

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <MobileHeader activeTab={activeTab} />
      <div className="flex-1 overflow-auto">
        {activeTab === "storybooks" && <StorybooksTab />}
        {activeTab === "characters" && <CharactersTab />}
        {activeTab === "library" && <StoryLibraryTab />}
        {activeTab === "keepsakes" && <KeepsakesTab />}
        {activeTab === "profile" && <ProfileTab />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </main>
  )
}
