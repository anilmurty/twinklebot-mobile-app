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
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      )
    }

    if (!subscription) {
      return NextResponse.json({
        has_subscription: false,
        subscription: null,
      })
    }

    // Fetch subscription plan separately
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.subscription_plan_id)
      .single()

    if (planError) {
      console.error('Error fetching subscription plan:', planError)
      // Return subscription without plan details if plan fetch fails
      return NextResponse.json({
        has_subscription: true,
        subscription: {
          id: subscription.id,
          plan: null,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          stories_used_this_period: subscription.stories_used_this_period || 0,
          stories_remaining: 0,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
      })
    }

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

