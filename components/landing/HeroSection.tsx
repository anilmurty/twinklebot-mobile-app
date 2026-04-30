"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronRight } from "lucide-react"
import { trackEvent } from "@/lib/utils/analytics"

const HEADLINE_TOP = "Storybooks Where"
const HEADLINE_BOTTOM = "Your Child Is The Hero"
const SUBHEAD = "Free stories ready to read now. Personalize your favorites with your child as the hero."
const MICROCOPY = "50+ free stories with no signup at all."
const SAMPLE_PAIRS = [
  { photo: "/sample-photo-4.png", scene: "/sample-scene-4.jpeg", name: "Aanya" },
  { photo: "/sample-photo-2.png", scene: "/sample-scene-2.jpeg", name: "Leo" },
  { photo: "/sample-photo-3.png", scene: "/sample-scene-3.jpeg", name: "Mia" },
  { photo: "/sample-photo-1.png", scene: "/sample-scene-1.jpeg", name: "Maya" },
]

function handlePrimary(location: string) {
  trackEvent("cta_click", { location, label: "Get Started Free" })
  window.location.href = "/app"
}

function handleSecondary(location: string) {
  trackEvent("cta_click", { location, label: "Browse Free Stories" })
}

/**
 * Side-by-side display: child photo on the left, storybook scene on the right,
 * connected by an animated magical arrow showing the child being placed into the scene.
 */
function BeforeAfterSlider({ idSuffix: _idSuffix }: { idSuffix: string }) {
  const [pairIndex, setPairIndex] = useState(0)

  const pair = SAMPLE_PAIRS[pairIndex]

  const nextPair = () => {
    setPairIndex((i) => (i + 1) % SAMPLE_PAIRS.length)
  }

  return (
    <div className="w-full">
      <div className="relative w-full rounded-3xl border border-border/50 shadow-2xl shadow-primary/20 bg-card overflow-hidden">
        <div className="grid grid-cols-2 gap-0">
          {/* Photo (left) */}
          <div className="relative aspect-[3/4] bg-card">
            <Image
              src={pair.photo}
              alt={`Photo of ${pair.name}`}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain bg-card"
              priority={pairIndex === 0}
              {...(pairIndex === 0 ? { fetchPriority: "high" as const } : {})}
            />
            <span className="pointer-events-none absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
              Photo
            </span>
          </div>

          {/* Storybook scene (right) */}
          <div className="relative aspect-[3/4] bg-card">
            <Image
              src={pair.scene}
              alt={`Storybook scene featuring ${pair.name}`}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-contain bg-card"
              priority={pairIndex === 0}
            />
            <span className="pointer-events-none absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-md">
              Storybook Scene
            </span>
          </div>
        </div>

        {/* Magical arrow connecting photo → scene — clickable to cycle samples */}
        <button
          type="button"
          onClick={nextPair}
          aria-label="View another sample"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group focus:outline-none"
        >
          <div className="relative flex items-center justify-center h-14 w-28 sm:h-16 sm:w-32">
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-primary/40 blur-2xl animate-pulse" />
            {/* Arrow body */}
            <div className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/50 border-2 border-white transition-transform group-hover:scale-110 group-active:scale-95">
              <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={3} />
            </div>
            {/* Sparkles */}
            <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse [animation-delay:300ms]" />
          </div>
        </button>
      </div>

      {/* Caption + cycle CTA */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sample shown with {pair.name}. Your story features your child.
        </p>
        <Button
          onClick={nextPair}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/30 whitespace-nowrap"
        >
          View another sample
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Pair dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {SAMPLE_PAIRS.map((_, i) => (
          <button
            key={i}
            onClick={() => setPairIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === pairIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
            aria-label={`Sample ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative">
      {/* Desktop: text left, slider right */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16 xl:py-24">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1
                className="text-5xl xl:text-6xl font-bold leading-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span className="text-primary">{HEADLINE_TOP}</span>
                <br />
                <span className="text-foreground">{HEADLINE_BOTTOM}</span>
              </h1>

              <p className="text-lg xl:text-xl text-muted-foreground mb-8 leading-relaxed">
                {SUBHEAD}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => handlePrimary("hero_desktop")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                >
                  Make your child a hero
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <a href="/stories" onClick={() => handleSecondary("hero_desktop")}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-border text-foreground hover:bg-muted h-14 px-8 text-lg"
                  >
                    Browse 50+ Free Stories
                  </Button>
                </a>
              </div>

            </div>

            <div>
              <BeforeAfterSlider idSuffix="desktop" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked — text first, slider second */}
      <div className="lg:hidden px-4 sm:px-6 pt-6 pb-10">
        <div className="max-w-xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-primary">{HEADLINE_TOP}</span>
            <br />
            <span className="text-foreground">{HEADLINE_BOTTOM}</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
            {SUBHEAD}
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <Button
              size="lg"
              onClick={() => handlePrimary("hero_mobile")}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 h-12 text-base"
            >
              Make your child a hero
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <a href="/stories" onClick={() => handleSecondary("hero_mobile")} className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-border text-foreground hover:bg-muted h-12 text-base"
              >
                Browse 50+ Free Stories
              </Button>
            </a>
          </div>

          <BeforeAfterSlider idSuffix="mobile" />

        </div>
      </div>
    </section>
  )
}
