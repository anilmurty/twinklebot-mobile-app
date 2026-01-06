import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { createCheckoutSession, getOrCreateCustomer, validateCoupon } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/payments/create-checkout
 * Create Stripe checkout session
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storybook_id, plan_id, coupon_code } = body

    if (!storybook_id || !plan_id) {
      return NextResponse.json(
        { error: 'storybook_id and plan_id are required' },
        { status: 400 }
      )
    }

    const userId = user.data.user?.id!
    const userEmail = user.data.user?.email || ''

    // Verify storybook ownership
    const supabase = createServerClient(request.headers.get('authorization'))
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id, status')
      .eq('id', storybook_id)
      .single()

    if (!storybook || storybook.user_id !== userId) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    // Get plan details
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Validate coupon if provided
    let couponId: string | undefined
    if (coupon_code) {
      const couponValidation = await validateCoupon(coupon_code)
      if (!couponValidation.valid) {
        return NextResponse.json(
          { error: couponValidation.error || 'Invalid coupon code' },
          { status: 400 }
        )
      }
      couponId = coupon_code
    }

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(userEmail, userId)

    // Determine checkout mode
    const mode = plan.plan_type === 'subscription' ? 'subscription' : 'payment'

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const successUrl = `${baseUrl}/?tab=storybooks&payment=success`
    const cancelUrl = `${baseUrl}/?tab=storybooks&payment=cancelled`

    const session = await createCheckoutSession({
      priceId: plan.stripe_price_id,
      customerId: customer.id,
      successUrl,
      cancelUrl,
      couponId,
      mode,
      metadata: {
        storybook_id,
        plan_id: plan_id.toString(),
        user_id: userId,
        coupon_code: coupon_code || '',
      },
    })

    // Update storybook with checkout session ID and payment status
    await supabaseAdmin
      .from('storybooks')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_price_id: plan.stripe_price_id,
        payment_status: 'pending',
        stripe_coupon_code: coupon_code || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybook_id)

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

