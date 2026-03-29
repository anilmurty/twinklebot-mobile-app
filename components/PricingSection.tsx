"use client"

import { useState, useEffect } from "react"
import { Check, Sparkles } from "lucide-react"
import { IS_EARLY_ACCESS } from "@/lib/config"
import { trackEvent } from "@/lib/utils/analytics"

interface Plan {
  id: number
  name: string
  price_amount: number // cents
  stories_per_period: number
  quality_tier: string
}

interface PricingSectionProps {
  onEarlyAccess: () => void
}

export function PricingSection({ onEarlyAccess }: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    fetch("/api/v1/subscription-plans")
      .then((r) => r.json())
      .then((data) => {
        const premium = (data.plans || [])
          .filter((p: Plan) => p.quality_tier === "premium" && p.stories_per_period > 0)
          .sort((a: Plan, b: Plan) => a.stories_per_period - b.stories_per_period)
        setPlans(premium)
      })
      .catch(() => {})
  }, [])

  const singlePrice = plans.find((p) => p.stories_per_period === 1)?.price_amount || 0

  const getSavings = (plan: Plan): number => {
    if (plan.stories_per_period <= 1 || !singlePrice) return 0
    const expected = singlePrice * plan.stories_per_period
    return Math.round(((expected - plan.price_amount) / expected) * 100)
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const freeFeatures = [
    "Browse 50+ educational stories",
    "Full audio narration on every story",
    "Read on web, iOS, or Android",
    "No photo upload needed",
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
            Start free. Go deeper when you&apos;re ready.
          </p>
        </div>

        {/* Two-card layout */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1 — Always Free */}
          <div className="bg-card rounded-3xl border border-border/50 p-8 flex flex-col">
            <h3 className="text-xl font-bold text-foreground mb-1">Always Free</h3>
            <p className="text-muted-foreground text-sm mb-6">
              No photo, no payment, no personal info required.
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                  <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                trackEvent("cta_click", { location: "pricing_free", label: "Get Early Access" })
                onEarlyAccess()
              }}
              className="text-primary font-semibold text-sm hover:underline text-left"
            >
              Get Early Access →
            </button>
          </div>

          {/* Card 2 — Personalized Stories */}
          <div className="bg-card rounded-3xl border-2 border-primary/30 p-8 flex flex-col relative">
            {IS_EARLY_ACCESS && (
              <div className="absolute -top-3 right-6">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md">
                  FREE during Early Access
                </span>
              </div>
            )}

            <h3 className="text-xl font-bold text-foreground mb-1 mt-1">Personalized Stories</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Your child, the hero — in minutes.
            </p>

            {plans.length > 0 ? (
              <div className="space-y-3 mb-8 flex-1">
                {plans.map((plan) => {
                  const savings = getSavings(plan)
                  const isBestValue = plan.stories_per_period === 4
                  const label =
                    plan.stories_per_period === 1
                      ? "1 Story"
                      : `${plan.stories_per_period} Stories`

                  return (
                    <div
                      key={plan.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isBestValue ? "border-primary/30 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        {savings > 0 && (
                          <span className="text-[10px] font-medium text-secondary">
                            Save {savings}%
                          </span>
                        )}
                        {isBestValue && (
                          <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            BEST VALUE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {IS_EARLY_ACCESS ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(plan.price_amount)}
                            </span>
                            <span className="text-sm font-bold text-primary">FREE</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            {formatPrice(plan.price_amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3 mb-8 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            )}

            <button
              onClick={() => {
                trackEvent("cta_click", { location: "pricing_personalized", label: "Get Early Access" })
                onEarlyAccess()
              }}
              className="text-primary font-semibold text-sm hover:underline text-left"
            >
              Get Early Access →
            </button>
          </div>
        </div>

        {/* Trust message */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground text-sm">
            One-time purchase. No subscription required. Your storybooks are yours to keep forever.
          </p>
        </div>
      </div>
    </section>
  )
}
