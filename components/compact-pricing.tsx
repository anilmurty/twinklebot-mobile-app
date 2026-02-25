"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: number
  name: string
  description?: string
  price_amount: number // in cents
  stories_per_period: number
  features?: string[]
}

interface CompactPricingProps {
  plans: Plan[]
  selectedPlanId: number | null
  onPlanSelect: (planId: number) => void
  onPurchase: (planId: number) => void
  isSubmitting?: boolean
  storyCredits?: number
  onUseCredit?: () => void
  /** Map of plan credits → localized price string from RevenueCat (e.g. "$7.99") */
  iapPriceMap?: Record<number, string>
}

export function CompactPricing({
  plans,
  selectedPlanId,
  onPlanSelect,
  onPurchase,
  isSubmitting = false,
  storyCredits = 0,
  onUseCredit,
  iapPriceMap,
}: CompactPricingProps) {
  // Sort plans by stories_per_period (1, 2, 3, 4)
  const sortedPlans = [...plans]
    .filter(p => p.stories_per_period > 0)
    .sort((a, b) => a.stories_per_period - b.stories_per_period)

  // Calculate savings percentage
  const getSavings = (plan: Plan): number => {
    const singlePrice = 799 // $7.99 base price
    const expectedPrice = singlePrice * plan.stories_per_period
    const actualPrice = plan.price_amount
    if (plan.stories_per_period <= 1) return 0
    return Math.round(((expectedPrice - actualPrice) / expectedPrice) * 100)
  }

  // If user has credits, show use credit option
  if (storyCredits > 0 && onUseCredit) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-center text-muted-foreground">
          You have <span className="font-semibold text-foreground">{storyCredits} story {storyCredits === 1 ? 'credit' : 'credits'}</span>
        </p>
        <Button
          onClick={onUseCredit}
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Unlocking...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Use 1 Credit to Unlock
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedPlans.map((plan) => {
        const isSelected = selectedPlanId === plan.id
        const price = (plan.price_amount / 100).toFixed(2)
        const savings = getSavings(plan)
        const isBestValue = plan.stories_per_period === 4

        return (
          <button
            key={plan.id}
            onClick={() => onPlanSelect(plan.id)}
            className={cn(
              "w-full text-left p-3 rounded-lg border-2 transition-all",
              "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border bg-card",
              isBestValue && !isSelected && "border-primary/30 bg-primary/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {plan.stories_per_period === 1
                        ? "Single Storybook"
                        : `${plan.stories_per_period}-Story Bundle`}
                    </span>
                    {savings > 0 && (
                      <span className="text-[10px] font-medium text-primary">
                        Save {savings}%
                      </span>
                    )}
                    {isBestValue && (
                      <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        BEST VALUE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.stories_per_period === 1
                      ? "One personalized keepsake"
                      : `Pick any ${plan.stories_per_period} from the library`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">
                  {iapPriceMap?.[plan.stories_per_period] || `$${price}`}
                </span>
                {plan.stories_per_period > 1 && !iapPriceMap?.[plan.stories_per_period] && (
                  <p className="text-[10px] text-muted-foreground">
                    ${(plan.price_amount / plan.stories_per_period / 100).toFixed(2)}/story
                  </p>
                )}
              </div>
            </div>
          </button>
        )
      })}

      <Button
        onClick={() => selectedPlanId && onPurchase(selectedPlanId)}
        disabled={!selectedPlanId || isSubmitting}
        className="w-full mt-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Continue to Payment
          </>
        )}
      </Button>

      <p className="text-[10px] text-center text-muted-foreground">
        Yours to keep forever • No subscription required
      </p>
    </div>
  )
}

