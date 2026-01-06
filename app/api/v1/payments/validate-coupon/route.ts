import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/stripe/client'

/**
 * POST /api/v1/payments/validate-coupon
 * Validate a Stripe coupon code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { coupon_code } = body

    if (!coupon_code || typeof coupon_code !== 'string') {
      return NextResponse.json(
        { error: 'coupon_code is required' },
        { status: 400 }
      )
    }

    const validation = await validateCoupon(coupon_code.trim().toUpperCase())

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        error: validation.error || 'Invalid coupon code',
      })
    }

    const coupon = validation.coupon!

    // Format discount info
    let discountInfo: {
      type: 'percentage' | 'fixed'
      value: number
      formatted: string
    }

    if (coupon.percent_off) {
      discountInfo = {
        type: 'percentage',
        value: coupon.percent_off,
        formatted: `${coupon.percent_off}% off`,
      }
    } else if (coupon.amount_off) {
      discountInfo = {
        type: 'fixed',
        value: coupon.amount_off,
        formatted: `$${(coupon.amount_off / 100).toFixed(2)} off`,
      }
    } else {
      discountInfo = {
        type: 'percentage',
        value: 0,
        formatted: 'No discount',
      }
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        discount: discountInfo,
      },
    })
  } catch (error: any) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

