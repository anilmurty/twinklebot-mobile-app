"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X } from "lucide-react"
import { paymentsApi } from "@/lib/api-client"

interface CouponInputProps {
  onCouponApplied: (coupon: { id: string; discount: { formatted: string } }) => void
  onCouponRemoved: () => void
  disabled?: boolean
}

export function CouponInput({ onCouponApplied, onCouponRemoved, disabled }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; discount: { formatted: string } } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!couponCode.trim()) {
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const result = await paymentsApi.validateCoupon(couponCode.trim().toUpperCase())

      if (result.valid && result.coupon) {
        setAppliedCoupon(result.coupon)
        onCouponApplied(result.coupon)
        setError(null)
      } else {
        setError(result.error || "Invalid coupon code")
        setAppliedCoupon(null)
        onCouponRemoved()
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate coupon")
      setAppliedCoupon(null)
      onCouponRemoved()
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemove = () => {
    setCouponCode("")
    setAppliedCoupon(null)
    setError(null)
    onCouponRemoved()
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Coupon applied: {appliedCoupon.discount.formatted}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">{couponCode}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isValidating && !disabled) {
              handleApply()
            }
          }}
          disabled={disabled || isValidating}
          className="flex-1"
        />
        <Button
          onClick={handleApply}
          disabled={disabled || isValidating || !couponCode.trim()}
          size="default"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

