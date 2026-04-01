"use client"

import { BookOpen, Users, Library, Gift, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "storybooks" | "characters" | "library" | "keepsakes" | "profile"
  onTabChange: (tab: "storybooks" | "characters" | "library" | "keepsakes" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "storybooks" as const, label: "Storybooks", icon: BookOpen },
    { id: "characters" as const, label: "Characters", icon: Users },
    { id: "library" as const, label: "Library", icon: Library },
    { id: "keepsakes" as const, label: "Keepsakes", icon: Gift },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors flex-1 cursor-pointer",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
