"use client"

import { BookOpen, Users, Library, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "storybooks" | "characters" | "library" | "profile"
  onTabChange: (tab: "storybooks" | "characters" | "library" | "profile") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "storybooks" as const, label: "Storybooks", icon: BookOpen },
    { id: "characters" as const, label: "Characters", icon: Users },
    { id: "library" as const, label: "Story Library", icon: Library },
    { id: "profile" as const, label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors flex-1",
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
