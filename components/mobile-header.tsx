"use client"

import Image from "next/image"

const TAB_TITLES: Record<string, string> = {
  storybooks: "My Storybooks",
  characters: "Characters",
  library: "Story Library",
  profile: "Profile",
}

interface MobileHeaderProps {
  activeTab: string
}

export function MobileHeader({ activeTab }: MobileHeaderProps) {
  const title = TAB_TITLES[activeTab] || "Twinklebot"

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-3 px-4 h-12">
        <Image
          src="/logo.png"
          alt="Twinklebot"
          width={28}
          height={28}
          className="shrink-0"
        />
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
      </div>
    </header>
  )
}
