"use client"

import Link from "next/link"
import { BookOpen, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/utils/analytics"

export function TwoPathsSection() {
  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Two ways to start
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Card 1: Browse Free (secondary treatment) */}
          <div className="bg-card rounded-3xl p-8 border border-border/50 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-foreground" />
            </div>
            <h3
              className="text-2xl font-bold text-foreground mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Browse without logging in
            </h3>
            <p className="text-muted-foreground mb-8 flex-grow">
              50+ educational stories ready to read instantly. No account, no photo, just stories.
            </p>
            <Link
              href="/stories"
              onClick={() =>
                trackEvent("cta_click", { location: "two_paths", label: "Browse the library" })
              }
              className="inline-block"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 text-base font-semibold border-border text-foreground hover:bg-muted"
              >
                Browse the library
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Card 2: Personalize (primary treatment) */}
          <div className="bg-primary/5 rounded-3xl p-8 border-2 border-primary/40 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3
              className="text-2xl font-bold text-foreground mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Login and Personalize
            </h3>
            <p className="text-muted-foreground mb-8 flex-grow">
              Upload a photo and watch your child become the hero.
            </p>
            <a
              href="/app"
              onClick={() =>
                trackEvent("cta_click", { location: "two_paths", label: "Get started" })
              }
              className="inline-block"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-6 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              >
                Get started
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
