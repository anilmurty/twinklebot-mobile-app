"use client"

import { StorybooksTab } from "@/components/storybooks-tab"
import { CharactersTab } from "@/components/characters-tab"
import { StoryLibraryTab } from "@/components/story-library-tab"
import { ProfileTab } from "@/components/profile-tab"
import { KeepsakesTab } from "@/components/keepsakes-tab"
import { BookOpen, Users, Library, Gift, User } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

interface DesktopLayoutProps {
  activeTab: "storybooks" | "characters" | "library" | "keepsakes" | "profile"
  onTabChange: (tab: "storybooks" | "characters" | "library" | "keepsakes" | "profile") => void
}

export function DesktopLayout({ activeTab, onTabChange }: DesktopLayoutProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const mainContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'keepsakes', 'profile'].includes(tab)) {
      onTabChange(tab as typeof activeTab)
      // Scroll content area to top when navigating via URL (e.g. after creating a story/character)
      requestAnimationFrame(() => {
        mainContentRef.current?.scrollTo({ top: 0 })
      })
    }
  }, [searchParams, onTabChange])

  const handleTabChange = (tab: "storybooks" | "characters" | "library" | "keepsakes" | "profile") => {
    onTabChange(tab)
    // Use current pathname to preserve /app vs / route
    router.push(`${pathname}?tab=${tab}`, { scroll: false })
    // Scroll content area to top on tab switch
    requestAnimationFrame(() => {
      mainContentRef.current?.scrollTo({ top: 0 })
    })
  }

  const tabs = [
    { id: "storybooks" as const, label: "Storybooks", icon: BookOpen },
    { id: "characters" as const, label: "Characters", icon: Users },
    { id: "library" as const, label: "Library", icon: Library },
    { id: "keepsakes" as const, label: "Keepsakes", icon: Gift },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 lg:w-72 bg-card border-r border-border flex flex-col shadow-sm">
        {/* Logo/Brand */}
        <div className="p-4 lg:p-6 border-b border-border flex justify-center">
          <Image
            src="/logo.svg"
            alt="Twinklebot"
            width={240}
            height={128}
            className="h-16 lg:h-20 w-auto"
            style={{ filter: "brightness(1.6) saturate(1.2)" }}
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-6 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-3.5 rounded-lg transition-all cursor-pointer text-left",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="font-medium text-sm lg:text-base">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <div ref={mainContentRef} className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto w-full h-full">
            {activeTab === "storybooks" && <StorybooksTab />}
            {activeTab === "characters" && <CharactersTab />}
            {activeTab === "library" && <StoryLibraryTab />}
            {activeTab === "keepsakes" && <KeepsakesTab />}
            {activeTab === "profile" && <ProfileTab />}
          </div>
        </div>
      </main>
    </div>
  )
}
