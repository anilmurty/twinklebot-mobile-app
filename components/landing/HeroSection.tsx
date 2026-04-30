"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sparkles, ChevronRight } from "lucide-react"
import { trackEvent } from "@/lib/utils/analytics"

const HEADLINE_TOP = "Storybooks Where"
const HEADLINE_BOTTOM = "Your Child Is The Hero"
const SUBHEAD = "Free stories ready to read now. Personalize your favorites with your child as the hero."
const MICROCOPY = "50+ free stories with no signup at all."
const SAMPLE_CAPTION = "Sample shown with Maya. Your story features your child."

function handlePrimary(location: string) {
  trackEvent("cta_click", { location, label: "Get Started Free" })
  window.location.href = "/app"
}

function handleSecondary(location: string) {
  trackEvent("cta_click", { location, label: "Browse Free Stories" })
}

/**
 * Before/after slider — left side is the generic scene, right side reveals
 * the personalized scene. Drag the handle (or use arrow keys) to compare.
 */
function BeforeAfterSlider({ idSuffix }: { idSuffix: string }) {
  const [position, setPosition] = useState(50)
  const [interacted, setInteracted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    setInteracted(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    updateFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    updateFromClientX(e.clientX)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setPosition((p) => Math.max(0, p - 5))
      setInteracted(true)
      e.preventDefault()
    } else if (e.key === "ArrowRight") {
      setPosition((p) => Math.min(100, p + 5))
      setInteracted(true)
      e.preventDefault()
    }
  }

  return (
    <div className="w-full">
      {/* TODO: Replace public/hero-before.jpg and public/hero-after.jpg with real before/after personalization images */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-3xl border border-border/50 shadow-2xl shadow-primary/20 bg-card select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Before image (LCP) */}
        <Image
          src="/hero-before.jpg"
          alt="Story scene before personalization"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
          fetchPriority="high"
        />
        {/* After image — clipped to reveal from the left edge up to the slider position */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden="true"
        >
          <Image
            src="/hero-after.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            loading={interacted ? "eager" : "lazy"}
          />
        </div>

        {/* Labels */}
        <span className="pointer-events-none absolute top-3 left-3 text-xs font-semibold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
          Before
        </span>
        <span className="pointer-events-none absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider text-white bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-md">
          Personalized
        </span>

        {/* Divider line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        />

        {/* Drag handle */}
        <button
          type="button"
          aria-label="Drag to compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          role="slider"
          id={`before-after-handle-${idSuffix}`}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-xl border-2 border-primary flex items-center justify-center cursor-ew-resize focus:outline-none focus:ring-4 focus:ring-primary/40"
          style={{ left: `${position}%` }}
        >
          <ChevronRight className="w-4 h-4 text-primary -mr-1 rotate-180" />
          <ChevronRight className="w-4 h-4 text-primary -ml-1" />
        </button>
      </div>
      <p className="mt-3 text-xs sm:text-sm text-muted-foreground text-center">{SAMPLE_CAPTION}</p>
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

              <div className="mt-8 flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{MICROCOPY}</p>
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 h-14 text-lg"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <a href="/stories" onClick={() => handleSecondary("hero_mobile")} className="block">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-border text-foreground hover:bg-muted h-14 text-lg"
              >
                Browse 50+ Free Stories
              </Button>
            </a>
          </div>

          <BeforeAfterSlider idSuffix="mobile" />

          <div className="mt-6 flex items-start gap-2 text-left">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{MICROCOPY}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
