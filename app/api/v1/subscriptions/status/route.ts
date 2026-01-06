import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/subscriptions/status
 * Check if user has active subscription
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.data.user?.id!

    // Check for active subscription
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        subscription_plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        subscription: null,
      })
    }

    const plan = subscription.subscription_plan as any

    // Calculate stories remaining
    const storiesRemaining = Math.max(
      0,
      (plan?.stories_per_period || 0) - (subscription.stories_used_this_period || 0)
    )

    return NextResponse.json({
      has_subscription: true,
      subscription: {
        id: subscription.id,
        plan: {
          id: plan?.id,
          name: plan?.name,
          plan_type: plan?.plan_type,
          billing_interval: plan?.billing_interval,
          stories_per_period: plan?.stories_per_period,
        },
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        stories_used_this_period: subscription.stories_used_this_period || 0,
        stories_remaining,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

