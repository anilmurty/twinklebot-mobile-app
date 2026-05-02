"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sparkles } from "lucide-react"
import Link from "next/link"
import { trackEvent } from "@/lib/utils/analytics"

interface Scene {
  scene_number: number
  headline?: string
  script_text?: string
  image_url?: string
}

interface StoryPreviewViewerProps {
  title: string
  characterName: string
  description: string
  scenes: Scene[]
  coverImageUrl: string | null
  personalizeUrl: string
  storySlug?: string
}

export function StoryPreviewViewer({
  title,
  characterName,
  description,
  scenes,
  coverImageUrl,
  personalizeUrl,
  storySlug,
}: StoryPreviewViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [textExpanded, setTextExpanded] = useState(false)
  const [textHidden, setTextHidden] = useState(false)
  const [textOverflows, setTextOverflows] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Total: cover (0) + scenes (1..n) + end (n+1)
  const totalPages = scenes.length + 2
  const isCover = currentPage === 0
  const isEnd = currentPage === totalPages - 1
  const sceneIndex = currentPage - 1
  const scene = !isCover && !isEnd ? scenes[sceneIndex] : null

  const goNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1)
  }
  const goPrev = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1)
  }

  // Reset expanded state on page change (but preserve hide preference)
  useEffect(() => {
    setTextExpanded(false)
  }, [currentPage])

  // Fire a scene_view event on every page change so GA4 has an explicit
  // engagement signal — the fullscreen swipe-only viewer otherwise produces
  // no scroll/click events and registers as 0s engagement time.
  useEffect(() => {
    const pageType = currentPage === 0 ? "cover" : currentPage === totalPages - 1 ? "end" : "scene"
    trackEvent("scene_view", {
      story_slug: storySlug,
      page_index: currentPage,
      page_type: pageType,
      total_pages: totalPages,
    })
  }, [currentPage, storySlug, totalPages])

  // Check overflow
  useEffect(() => {
    if (textHidden) return
    requestAnimationFrame(() => {
      const el = textRef.current
      if (el) {
        el.scrollTop = 0
        setTextOverflows(el.scrollHeight > el.clientHeight + 4)
      }
    })
  }, [currentPage, textHidden])

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const d = touchStart - touchEnd
    if (Math.abs(d) < 50) return
    d > 0 ? goNext() : goPrev()
    setTouchStart(null)
    setTouchEnd(null)
  }

  const coverImg = coverImageUrl || scenes[0]?.image_url || null

  // Warm the browser cache for cover + every scene image as soon as the viewer
  // mounts, so swiping doesn't stall on slow networks (cellular, in-app
  // browsers). Without this, each scene's <img> only starts loading after the
  // previous scene unmounts — users see a blank gap during the swap.
  useEffect(() => {
    if (typeof window === "undefined") return
    const urls: string[] = []
    if (coverImg) urls.push(coverImg)
    scenes.forEach((s) => {
      if (s.image_url) urls.push(s.image_url)
    })
    urls.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [coverImg, scenes])

  const trackCtaClick = (location: string, extra?: Record<string, string | number | boolean | undefined>) => {
    trackEvent("cta_click", {
      location,
      label: "Personalize with your child",
      story_slug: storySlug,
      intent: "personalize",
      ...extra,
    })
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-black select-none min-h-screen h-screen h-svh sm:min-h-0 sm:h-auto sm:aspect-[3/4] sm:rounded-2xl sm:border sm:border-border"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Cover Page ── */}
      {isCover && (
        <div className="absolute inset-0 flex items-center justify-center">
          {coverImg && (
            <img
              src={coverImg}
              alt="Cover"
              loading="eager"
              decoding="async"
              // @ts-expect-error fetchpriority is valid HTML, React 19 types lag behind
              fetchpriority="high"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          <div className="relative z-10 text-center px-6 max-w-lg">
            <h2 className="text-2xl md:text-3xl font-bold text-white font-serif mb-3 drop-shadow-lg">
              {title}
            </h2>
            <p className="text-white/70 text-sm font-serif italic mb-4">{description}</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-white/80 text-sm">Starring</span>
              <span className="text-amber-500 font-bold">{characterName}</span>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <Link
              href={personalizeUrl}
              onClick={() => trackCtaClick("story_detail_cover_overlay")}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 py-2.5 text-sm shadow-lg shadow-primary/30"
            >
              Make this YOUR child&apos;s story
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Scene Page ── */}
      {scene && (
        <div className="absolute inset-0">
          {scene.image_url && (
            <img
              src={scene.image_url}
              alt={scene.headline || `Scene ${sceneIndex + 1}`}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Top block: scene headline (when present) with the per-scene CTA pill anchored
              directly below it. Both share one gradient region. */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent px-4 pt-3 pb-5 z-10">
            {scene.headline && (
              <div className="relative mb-2">
                <h3
                  className="text-yellow-300 text-lg md:text-xl font-bold font-serif text-center px-12"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                >
                  {scene.headline}
                </h3>
                <span className="absolute top-0 right-0 text-white text-xs bg-amber-800/70 px-2 py-0.5 rounded-full">
                  {sceneIndex + 1}/{scenes.length}
                </span>
              </div>
            )}
            <div className="flex justify-center">
              <Link
                href={personalizeUrl}
                onClick={() => trackCtaClick("story_detail_scene_pill", { scene_number: scene.scene_number })}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 py-2.5 text-sm shadow-lg shadow-primary/30"
              >
                Put YOUR child in this story
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Text overlay */}
          {scene.script_text && !textHidden && (
            <div className="absolute bottom-8 left-0 right-0 z-10 bg-gradient-to-t from-black/95 via-black/85 to-black/60 px-4 pt-1 pb-1">
              {textOverflows && (
                <div className="flex justify-center pb-0.5">
                  <button
                    onClick={() => setTextExpanded(!textExpanded)}
                    className="text-white/70 hover:text-white p-1"
                  >
                    {textExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              )}
              <div
                ref={textRef}
                className="overflow-y-auto text-center max-w-2xl mx-auto transition-[max-height] duration-300"
                style={{ maxHeight: textExpanded ? "50%" : "12vh" }}
              >
                {scene.script_text.split("\n\n").map((stanza, i) => (
                  <div key={i} className={i > 0 ? "mt-2" : ""}>
                    {stanza.split("\n").filter(l => l.trim()).map((line, j) => (
                      <p
                        key={j}
                        className="text-white text-sm md:text-base leading-relaxed font-serif"
                        style={{ textShadow: "0 2px 6px rgba(0,0,0,0.9)" }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show/hide text toggle */}
          {scene.script_text && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 px-4 py-1.5 flex justify-between items-center">
              <button
                onClick={() => setTextHidden(!textHidden)}
                className="px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white/80 text-[10px] uppercase tracking-widest font-semibold hover:bg-white/20"
              >
                {textHidden ? "show text" : "hide text"}
              </button>
              {!scene.headline && (
                <span className="text-white text-xs bg-amber-800/70 px-2 py-0.5 rounded-full">
                  {sceneIndex + 1}/{scenes.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── End Page ── */}
      {isEnd && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-black to-black" />
          <div className="relative z-10 text-center px-6 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-serif mb-2 drop-shadow-lg">
              The End
            </h2>
            <p className="text-white/60 text-sm font-serif italic mb-6">
              of {characterName}&apos;s adventure
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-px bg-white/30" />
              <Sparkles className="w-5 h-5 text-primary" />
              <div className="w-12 h-px bg-white/30" />
            </div>
            <Link
              href={personalizeUrl}
              onClick={() => trackCtaClick("story_detail_end_card")}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 py-2.5 text-sm shadow-lg shadow-primary/30"
            >
              Send YOUR child on this adventure
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setCurrentPage(0)}
              className="block mx-auto mt-3 text-white/60 hover:text-white text-xs"
            >
              ← Read again
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom navigation row ── */}
      {isCover ? (
        // Cover: arrows hug the swipe-helper text in the center, positioned
        // midway between the CTA button and the bottom of the viewer.
        <div className="absolute bottom-[28%] left-0 right-0 z-20 flex items-center justify-center gap-3">
          <p className="text-white/60 text-xs">Swipe or click to read</p>
          {currentPage < totalPages - 1 && (
            <button
              onClick={goNext}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          )}
        </div>
      ) : (
        // Scenes / end: arrows pinned at the left/right edges, vertically centered
        // so they sit above the bottom text overlay instead of on top of the script.
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex items-center justify-between px-3 pointer-events-none">
          {currentPage > 0 ? (
            <button
              onClick={goPrev}
              className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-primary" />
            </button>
          ) : (
            <span className="w-9 h-9" aria-hidden="true" />
          )}
          {currentPage < totalPages - 1 ? (
            <button
              onClick={goNext}
              className="pointer-events-auto w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          ) : (
            <span className="w-9 h-9" aria-hidden="true" />
          )}
        </div>
      )}

      {/* ── Page Dots ── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex gap-1 py-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentPage ? "bg-white" : "bg-white/30"
            }`}
            aria-label={`Go to page ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
