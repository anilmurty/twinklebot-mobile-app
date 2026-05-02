import Image from "next/image"
import { ChevronRight, Sparkles } from "lucide-react"

interface StaticBeforeAfterProps {
  leftImage: string
  rightImage: string
  leftAlt: string
  rightAlt: string
  caption?: string
  priority?: boolean
}

/**
 * Single-pair side-by-side hero: child photo (left) + storybook scene (right)
 * with a center "magic" arrow. Used by LP variants — no rotation, no dots.
 */
export function StaticBeforeAfter({
  leftImage,
  rightImage,
  leftAlt,
  rightAlt,
  caption,
  priority = true,
}: StaticBeforeAfterProps) {
  return (
    <div className="w-full">
      <div className="relative w-full rounded-3xl border border-border/50 shadow-2xl shadow-primary/20 bg-card overflow-hidden">
        <div className="grid grid-cols-2 gap-0">
          <div className="relative aspect-[3/4] bg-card">
            <Image
              src={leftImage}
              alt={leftAlt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
              priority={priority}
              {...(priority ? { fetchPriority: "high" as const } : {})}
            />
            <span className="pointer-events-none absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
              Photo
            </span>
          </div>

          <div className="relative aspect-[3/4] bg-card">
            <Image
              src={rightImage}
              alt={rightAlt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
              priority={priority}
            />
            <span className="pointer-events-none absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-md">
              Storybook Scene
            </span>
          </div>
        </div>

        {/* Center "magic" arrow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="relative flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16">
            <div className="absolute inset-0 rounded-full bg-primary/40 blur-2xl animate-pulse" />
            <div className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/50 border-2 border-white">
              <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
            </div>
            <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>

      {caption && (
        <p className="mt-3 text-center text-xs sm:text-sm text-muted-foreground">{caption}</p>
      )}
    </div>
  )
}
