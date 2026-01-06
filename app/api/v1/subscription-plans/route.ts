import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/subscription-plans
 * Fetch all active subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Deduplicate by plan_type - keep only the first (lowest display_order) of each type
    const deduplicatedPlans = (plans || []).reduce((acc: any[], plan: any) => {
      const existingPlan = acc.find((p: any) => p.plan_type === plan.plan_type)
      if (!existingPlan) {
        acc.push(plan)
      } else if (plan.display_order < existingPlan.display_order) {
        // Replace with plan that has lower display_order
        const index = acc.indexOf(existingPlan)
        acc[index] = plan
      }
      return acc
    }, [])

    return NextResponse.json({ plans: deduplicatedPlans })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

