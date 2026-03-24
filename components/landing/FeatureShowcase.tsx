"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const features = [
  {
    icon: "\u26A1",
    label: "Ready in seconds",
    category: "AI story creation",
    title: "A full story \u2014 before bedtime snacks",
    description:
      "Pick a theme, upload a photo, and TwinkleBot\u2019s AI crafts a complete illustrated storybook. From first tap to final page in under 30 seconds.",
  },
  {
    icon: "\uD83C\uDFA8",
    label: "The hero looks like them",
    category: "Character customization",
    title: "Unmistakably your child",
    description:
      "Upload a photo or customize their look \u2014 skin tone, hair, age \u2014 and watch them step right into every illustration as the star of the story.",
  },
  {
    icon: "\uD83C\uDF0D",
    label: "Their adventure, their choice",
    category: "Theme selection",
    title: "Every world imaginable",
    description:
      "Jungles, galaxies, ocean floors, ancient kingdoms \u2014 choose the setting that sparks their imagination. New themes added regularly.",
  },
  {
    icon: "\uD83D\uDD0A",
    label: "Stories that read themselves",
    category: "Audio narration",
    title: "Sit back. Press play.",
    description:
      "Every story comes with warm, expressive audio narration. Perfect for pre-readers, long car rides, or when you just need five minutes.",
  },
  {
    icon: "\uD83C\uDF93",
    label: "Learning dressed as magic",
    category: "Learning areas",
    title: "Knowledge in every page",
    description:
      "Every story teaches something real \u2014 math, languages, science, world cultures \u2014 woven in so naturally, they\u2019ll ask for another story before they realize they just had a lesson.",
  },
]

/* ─── Visual mockups ─── */

function SpeedMockup() {
  const steps = [
    { label: "Upload a photo", done: true },
    { label: "Choose a story", done: true },
    { label: "Generating story\u2026", inProgress: true },
    { label: "Ready to read!", done: false },
  ]
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              s.done
                ? "bg-primary text-primary-foreground"
                : s.inProgress
                  ? "border-2 border-primary text-primary animate-pulse"
                  : "border border-border text-muted-foreground"
            }`}
          >
            {s.done ? "\u2713" : i + 1}
          </div>
          <span
            className={`text-sm ${s.done ? "text-foreground line-through opacity-60" : s.inProgress ? "text-primary font-medium" : "text-muted-foreground"}`}
          >
            {s.label}
          </span>
        </div>
      ))}
      <div className="mt-4 inline-flex items-center gap-2 bg-primary/15 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
        <span>\u23F1</span> Story ready in ~18 seconds
      </div>
    </div>
  )
}

function CharacterMockup() {
  const rows = [
    { label: "Skin tone", options: ["\uD83C\uDFFB", "\uD83C\uDFFC", "\uD83C\uDFFD", "\uD83C\uDFFE", "\uD83C\uDFFF"], active: 2 },
    { label: "Hair", options: ["Curly", "Straight", "Wavy", "Short", "Long"], active: 0 },
    { label: "Age", options: ["2-3", "4-5", "6-7", "8-9", "10+"], active: 1 },
  ]
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-20 h-20 rounded-full bg-muted border-2 border-primary flex items-center justify-center text-3xl">
        \uD83E\uDDD2
      </div>
      <div className="w-full space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">{r.label}</p>
            <div className="flex gap-1.5 flex-wrap">
              {r.options.map((o, i) => (
                <button
                  key={o}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    i === r.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ThemesMockup() {
  const themes = [
    { emoji: "\uD83C\uDF34", label: "Jungle" },
    { emoji: "\uD83D\uDE80", label: "Space" },
    { emoji: "\uD83D\uDC20", label: "Ocean" },
    { emoji: "\uD83C\uDFF0", label: "Kingdom" },
    { emoji: "\uD83E\uDD84", label: "Fantasy" },
    { emoji: "\u2728", label: "Magic" },
  ]
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {themes.map((t, i) => (
        <div
          key={t.label}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${
            i === 1
              ? "bg-primary/15 border-2 border-primary"
              : "bg-muted border border-transparent hover:border-border"
          }`}
        >
          <span className="text-2xl">{t.emoji}</span>
          <span className="text-xs font-medium text-foreground">{t.label}</span>
        </div>
      ))}
    </div>
  )
}

function AudioMockup() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
          \uD83D\uDCD6
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Mission To The Moon</p>
          <p className="text-xs text-muted-foreground">Chapter 1 \u00B7 2:34</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5v11l10-5.5z" />
          </svg>
        </button>
      </div>
      {/* Waveform */}
      <div className="flex items-end gap-[3px] h-8 px-1">
        {Array.from({ length: 32 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.7) * 40 + Math.cos(i * 1.3) * 20
          const played = i < 12
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${played ? "bg-primary" : "bg-muted-foreground/30"}`}
              style={{ height: `${Math.max(15, h)}%` }}
            />
          )
        })}
      </div>
      {/* Scrubber */}
      <div className="relative h-1 bg-muted rounded-full">
        <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: "38%" }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground"
          style={{ left: "38%" }}
        />
      </div>
    </div>
  )
}

function LearningMockup() {
  const categories = [
    { emoji: "\uD83D\uDD22", label: "Math", bg: "bg-blue-500/15 text-blue-300" },
    { emoji: "\uD83D\uDCAC", label: "Languages", bg: "bg-green-500/15 text-green-300" },
    { emoji: "\uD83D\uDD2C", label: "Science", bg: "bg-purple-500/15 text-purple-300" },
    { emoji: "\uD83C\uDF10", label: "World", bg: "bg-orange-500/15 text-orange-300" },
    { emoji: "\uD83D\uDEF8", label: "Sci-Fi", bg: "bg-cyan-500/15 text-cyan-300" },
    { emoji: "\u2728", label: "+ More soon", bg: "bg-primary/15 text-primary" },
  ]
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {categories.map((c) => (
        <div
          key={c.label}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg ${c.bg}`}
        >
          <span className="text-2xl">{c.emoji}</span>
          <span className="text-xs font-semibold">{c.label}</span>
        </div>
      ))}
    </div>
  )
}

const mockups = [SpeedMockup, CharacterMockup, ThemesMockup, AudioMockup, LearningMockup]

/* ─── Main component ─── */

const CYCLE_MS = 5000

export function FeatureShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use refs for timer state to avoid stale closures and StrictMode double-invoke issues
  const progressRef = useRef(0)
  const activeRef = useRef(0)

  // Auto-advance timer
  useEffect(() => {
    if (paused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const tick = 50
    timerRef.current = setInterval(() => {
      progressRef.current += (tick / CYCLE_MS) * 100
      if (progressRef.current >= 100) {
        progressRef.current = 0
        activeRef.current = (activeRef.current + 1) % features.length
        setActive(activeRef.current)
      }
      setProgress(progressRef.current)
    }, tick)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused])

  // Pause on focus within
  const handleFocus = useCallback(() => setPaused(true), [])
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setPaused(false)
    }
  }, [])

  const selectFeature = useCallback((i: number) => {
    activeRef.current = i
    progressRef.current = 0
    setActive(i)
    setProgress(0)
  }, [])

  const Mockup = mockups[active]

  return (
    <section id="features" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3 text-center">
          What makes TwinkleBot special
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-serif text-center">
          Every detail, made for them
        </h2>
        <p className="text-muted-foreground text-center max-w-lg mx-auto mb-10 sm:mb-14">
          A story as unique as your child &mdash; and ready before bedtime.
        </p>

        {/* Feature switcher */}
        <div
          ref={containerRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="rounded-xl overflow-hidden border border-border"
        >
          {/* Mobile: horizontal tab row */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {features.map((f, i) => (
                <button
                  key={i}
                  aria-pressed={i === active}
                  onClick={() => selectFeature(i)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    i === active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Desktop: left panel (feature list) */}
            <div className="hidden md:flex flex-col w-[280px] shrink-0 bg-black/40 border-r border-border">
              {features.map((f, i) => (
                <button
                  key={i}
                  aria-pressed={i === active}
                  onClick={() => selectFeature(i)}
                  className={`relative text-left px-5 py-4 transition-colors ${
                    i === active
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "border-l-2 border-transparent hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{f.icon}</span>
                    <span
                      className={`text-sm font-medium ${i === active ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {f.label}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {i === active && !paused && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
                      <div
                        className="h-full bg-primary transition-[width] duration-75 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Right panel (content + mockup) */}
            <div className="flex-1 bg-card p-6 sm:p-8 md:p-10 min-h-[400px] flex flex-col">
              <div
                key={active}
                aria-live="polite"
                className="flex-1 animate-in fade-in duration-200"
              >
                <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
                  {features[active].category}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground font-serif mb-2">
                  {features[active].title}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-lg">
                  {features[active].description}
                </p>
                <div className="bg-muted/50 rounded-xl p-5 sm:p-6 max-w-md">
                  <Mockup />
                </div>
              </div>

              {/* Bottom row: dots + pause */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="flex gap-1.5">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => selectFeature(i)}
                      aria-label={`Feature ${i + 1}`}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === active ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
