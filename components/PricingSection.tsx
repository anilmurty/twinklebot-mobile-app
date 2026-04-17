"use client"

import { Check } from "lucide-react"
import { LANDING_PAGE_PLANS } from "@/lib/config"
import { trackEvent } from "@/lib/utils/analytics"

interface PricingSectionProps {
  onEarlyAccess: () => void
}

const bundleDescriptors: Record<number, string> = {
  1: "Perfect for trying it out",
  2: "Two bedtime adventures",
  3: "A week of magic",
  4: "The full experience",
}

export function PricingSection({ onEarlyAccess }: PricingSectionProps) {
  const plans = LANDING_PAGE_PLANS
  const singlePrice = plans[0].price_cents

  const getSavings = (stories: number, priceCents: number): number => {
    if (stories <= 1) return 0
    const expected = singlePrice * stories
    return Math.round(((expected - priceCents) / expected) * 100)
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const freeFeatures = [
    "Choose from 50+ educational stories",
    "Full audio narration on every story",
    "Optimized to read or listen on phone, tablet or laptop",
    "No photo upload needed",
    "No credit card needed. Free forever",
  ]

  return (
    <section id="pricing" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Pricing
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Personalize when you&apos;re ready.
          </p>
        </div>

        {/* Two-card layout */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1 — Always Free */}
          <div className="bg-card rounded-3xl border-2 border-green-500/30 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-foreground mb-1">Always Free</h3>
            <p className="text-muted-foreground text-sm mb-6">
              No photo, no payment, no personal info required.
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="/app"
              onClick={() => trackEvent("cta_click", { location: "pricing_free", label: "Get Started" })}
              className="text-primary font-semibold text-sm hover:underline text-left"
            >
              Get Started →
            </a>
          </div>

          {/* Card 2 — Personalized Stories */}
          <div className="bg-card rounded-3xl border-2 border-primary/30 p-8 flex flex-col relative">
            <div className="absolute -top-3 right-6">
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md">
                FREE story for limited time
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1 mt-1">Personalized Stories</h3>
            <p className="text-muted-foreground text-sm mb-6">
              A story only your child can star in — theirs to keep forever.
            </p>

            <div className="space-y-3 mb-4 flex-1">
              {plans.map((plan) => {
                const savings = getSavings(plan.stories, plan.price_cents)
                const isBestValue = plan.stories === 4
                const isFree = plan.stories === 1
                const label = plan.stories === 1 ? "1 Story" : `${plan.stories} Stories`
                const descriptor = bundleDescriptors[plan.stories]

                return (
                  <div
                    key={plan.stories}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isFree ? "border-primary/30 bg-primary/5" : isBestValue ? "border-primary/30 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        {savings > 0 && (
                          <span className="text-[10px] font-medium text-green-400">
                            Save {savings}%
                          </span>
                        )}
                        {isBestValue && (
                          <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            BEST VALUE
                          </span>
                        )}
                      </div>
                      {descriptor && (
                        <span className="text-xs text-muted-foreground">{descriptor}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isFree ? (
                        <>
                          <span className="text-sm text-muted-foreground/50 line-through">
                            {formatPrice(plan.price_cents)}
                          </span>
                          <span className="text-sm font-bold text-primary">FREE</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-foreground">
                          {formatPrice(plan.price_cents)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              One-time purchase. No subscription required. Your storybooks are yours to keep forever.
            </p>

            <a
              href="/app"
              onClick={() => trackEvent("cta_click", { location: "pricing_personalized", label: "Get Started" })}
              className="text-primary font-semibold text-sm hover:underline text-left"
            >
              Get Started →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
