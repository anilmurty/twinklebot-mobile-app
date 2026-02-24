"use client"

import Image from "next/image"

const TAB_TITLES: Record<string, string> = {
  storybooks: "My Storybooks",
  characters: "Characters",
  library: "Story Library",
  profile: "Profile",
}

const TAB_SUBTITLES: Record<string, string> = {
  storybooks: "Your personalized home library",
  characters: "Your storybook heroes",
  library: "Choose a template",
  profile: "Your account",
}

interface MobileHeaderProps {
  activeTab: string
}

export function MobileHeader({ activeTab }: MobileHeaderProps) {
  const title = TAB_TITLES[activeTab] || "Twinklebot"
  const subtitle = TAB_SUBTITLES[activeTab] || ""

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <Image
          src="/logo-horizontal.svg"
          alt="Twinklebot"
          width={400}
          height={96}
          className="shrink-0 h-9 w-auto"
          priority
        />
        <div className="flex flex-col justify-center items-end h-9">
          <span className="text-sm font-semibold text-muted-foreground leading-tight">{title}</span>
          <span className="text-xs text-muted-foreground/70 leading-tight">{subtitle}</span>
        </div>
      </div>
    </header>
  )
}
