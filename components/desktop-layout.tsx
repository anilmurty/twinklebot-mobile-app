"use client"

import { StorybooksTab } from "@/components/storybooks-tab"
import { CharactersTab } from "@/components/characters-tab"
import { StoryLibraryTab } from "@/components/story-library-tab"
import { ProfileTab } from "@/components/profile-tab"
import { BookOpen, Users, Library, User, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

interface DesktopLayoutProps {
  activeTab: "storybooks" | "characters" | "library" | "profile"
  onTabChange: (tab: "storybooks" | "characters" | "library" | "profile") => void
}

export function DesktopLayout({ activeTab, onTabChange }: DesktopLayoutProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['storybooks', 'characters', 'library', 'profile'].includes(tab)) {
      onTabChange(tab as typeof activeTab)
    }
  }, [searchParams, onTabChange])

  const handleTabChange = (tab: "storybooks" | "characters" | "library" | "profile") => {
    onTabChange(tab)
    router.push(`/?tab=${tab}`, { scroll: false })
  }

  const tabs = [
    { id: "storybooks" as const, label: "Storybooks", icon: BookOpen },
    { id: "characters" as const, label: "Characters", icon: Users },
    { id: "library" as const, label: "Story Library", icon: Library },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 lg:w-72 bg-card border-r border-border flex flex-col shadow-sm">
        {/* Logo/Brand */}
        <div className="p-6 lg:p-8 border-b border-border">
          <div className="flex items-center gap-2 lg:gap-3">
            <Sparkles className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Twinklebot</h1>
          </div>
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
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto w-full h-full">
            {activeTab === "storybooks" && <StorybooksTab />}
            {activeTab === "characters" && <CharactersTab />}
            {activeTab === "library" && <StoryLibraryTab />}
            {activeTab === "profile" && <ProfileTab />}
          </div>
        </div>
      </main>
    </div>
  )
}
