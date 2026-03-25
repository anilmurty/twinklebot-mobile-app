"use client"

import { useState, useEffect, useCallback, useRef } from "react"

const features = [
  {
    icon: "\u26A1",
    label: "Ready in minutes",
    category: "AI story creation",
    title: "A 10 scene story \u2014 ready before you can microwave snacks",
    description:
      "Choose a story, pick a theme, customize your child as a hero, and TwinkleBot\u2019s AI engine crafts a complete illustrated storybook. From clicking \u201CGenerate\u201D to full book in under 3 minutes.",
  },
  {
    icon: "\uD83E\uDDB8",
    label: "They really are the hero!",
    category: "Character customization",
    title: "Unmistakably your child",
    description:
      "Customize their look according to the story. Astronaut suit for the space mission. Shorts, hat and sunglasses for a day at the zoo. Or PJs for counting things around the house.",
  },
  {
    icon: "\uD83C\uDF0D",
    label: "Their adventure, their choice",
    category: "Story selection",
    title: "Every world imaginable",
    description:
      "From jungles, galaxies, ocean floors and futuristic robot worlds to your neighborhood farmer\u2019s market, there are 50+ stories to choose from and more added weekly.",
  },
  {
    icon: "\uD83D\uDD0A",
    label: "Stories that read themselves",
    category: "Audio narration",
    title: "Plus play and relax, or mute and read out loud.",
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
        <span>&#x23F1;&#xFE0F;</span> Story ready in ~3 minutes
      </div>
    </div>
  )
}

function CharacterMockup() {
  const cards = [
    { src: "/looks-modal-mission-to-the-moon-boy.jpg", alt: "Mission To The Moon - Boy" },
    { src: "/looks-modal-day-at-the-zoo-girl.jpg", alt: "Day at the Zoo - Girl" },
    { src: "/looks-modal-counting-around-the-house-boy.jpg", alt: "Counting Around the House - Boy" },
  ]
  const [front, setFront] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFront((prev) => (prev + 1) % cards.length)
    }, 1600)
    return () => clearInterval(interval)
  }, [cards.length])

  // Positions: front (top center), back-left, back-right
  const positions = [
    { x: 0, y: -15, rotate: 0, scale: 1, z: 3, opacity: 1 },       // front
    { x: -70, y: 25, rotate: -12, scale: 0.85, z: 1, opacity: 0.7 }, // back-left
    { x: 70, y: 25, rotate: 12, scale: 0.85, z: 2, opacity: 0.7 },   // back-right
  ]

  return (
    <div className="relative h-[280px] md:h-[380px] w-full flex items-center justify-center overflow-hidden">
      {cards.map((card, i) => {
        // Calculate position index: 0=front, 1=back-left, 2=back-right
        const posIdx = (i - front + cards.length) % cards.length
        const pos = positions[posIdx]
        return (
          <img
            key={card.alt}
            src={card.src}
            alt={card.alt}
            className="absolute w-[140px] md:w-[220px] rounded-xl border border-border shadow-xl"
            style={{
              transform: `translateX(${pos.x}px) translateY(${pos.y}px) rotate(${pos.rotate}deg) scale(${pos.scale})`,
              zIndex: pos.z,
              opacity: pos.opacity,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
            }}
          />
        )
      })}
    </div>
  )
}

function ThemesMockup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const assetUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/render/image/public/story-template-assets/${path}?quality=60`

  const covers = [
    { src: assetUrl("day-at-the-zoo/day-at-the-zoo.png"), label: "Day at the Zoo" },
    { src: assetUrl("mission-to-the-moon/mission-to-the-moon.png"), label: "Mission To The Moon" },
    { src: assetUrl("under-the-ocean/under-the-ocean.png"), label: "Underwater Adventure" },
    { src: assetUrl("the-robot-best-friend/the-robot-best-friend.png"), label: "Robot Best Friend" },
    { src: assetUrl("visit-to-the-farmers-market/visit-to-the-farmers-market.png"), label: "Farmer's Market" },
  ]

  const [front, setFront] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFront((prev) => (prev + 1) % covers.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [covers.length])

  // Positions: front center, back-left, back-right, hidden-left, hidden-right
  const positions = [
    { x: 0, y: 0, scale: 1, z: 5, opacity: 1 },
    { x: -80, y: 15, scale: 0.82, z: 3, opacity: 0.6 },
    { x: 80, y: 15, scale: 0.82, z: 3, opacity: 0.6 },
    { x: -130, y: 25, scale: 0.65, z: 1, opacity: 0.3 },
    { x: 130, y: 25, scale: 0.65, z: 1, opacity: 0.3 },
  ]

  return (
    <div className="relative h-[260px] md:h-[360px] w-full flex items-center justify-center overflow-hidden">
      {covers.map((cover, i) => {
        const posIdx = (i - front + covers.length) % covers.length
        const pos = positions[posIdx]
        return (
          <div
            key={cover.label}
            className="absolute flex flex-col items-center"
            style={{
              transform: `translateX(${pos.x}px) translateY(${pos.y}px) scale(${pos.scale})`,
              zIndex: pos.z,
              opacity: pos.opacity,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
            }}
          >
            <img
              src={cover.src}
              alt={cover.label}
              className="w-[120px] h-[160px] md:w-[180px] md:h-[240px] object-cover rounded-xl border border-border shadow-xl"
            />
            {posIdx === 0 && (
              <p className="mt-2 text-xs font-medium text-foreground text-center transition-opacity duration-300">
                {cover.label}
              </p>
            )}
          </div>
        )
      })}
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
          <p className="text-xs text-muted-foreground">10 SCENES &middot; 2:34</p>
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
  const tabRowRef = useRef<HTMLDivElement>(null)

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

  // Scroll mobile tab row to show active tab (without scrolling the page)
  useEffect(() => {
    const row = tabRowRef.current
    if (!row) return
    const btn = row.children[active] as HTMLElement
    if (!btn) return
    const scrollContainer = row.parentElement
    if (!scrollContainer) return
    const scrollLeft = btn.offsetLeft - scrollContainer.clientWidth / 2 + btn.clientWidth / 2
    scrollContainer.scrollTo({ left: scrollLeft, behavior: "smooth" })
  }, [active])

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
      <div className="max-w-7xl mx-auto">
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
            <div ref={tabRowRef} className="flex min-w-max">
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

            {/* Right panel (visual + text side by side) */}
            <div className="flex-1 bg-card p-6 sm:p-8 md:p-10 min-h-[480px] flex flex-col">
              <div
                key={active}
                aria-live="polite"
                className="flex-1 animate-in fade-in duration-200 flex flex-col md:flex-row gap-6 md:gap-10"
              >
                {/* Visual (left half) */}
                <div className="md:w-1/2 flex items-center justify-center">
                  <div className="bg-muted/50 rounded-xl p-5 sm:p-6 w-full h-full flex items-center justify-center">
                    <Mockup />
                  </div>
                </div>
                {/* Text (right half) */}
                <div className="md:w-1/2 flex flex-col justify-center">
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
                    {features[active].category}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground font-serif mb-2">
                    {features[active].title}
                  </h3>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {features[active].description}
                  </p>
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
