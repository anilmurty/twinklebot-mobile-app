import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

/**
 * GET /api/v1/profile
 * Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const userId = user.data.user?.id!
    const userEmail = user.data.user?.email || ''
    
    // Ensure profile exists (create if doesn't exist)
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*, custom_stories_per_month, story_credits')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      profile = newProfile
      error = null
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get counts
    const [charactersResult, storybooksResult, purchasedStorybooksResult] = await Promise.all([
      supabase
        .from('characters')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.data.user?.id),
      supabase
        .from('storybooks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.data.user?.id),
      supabase
        .from('storybooks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.data.user?.id)
        .eq('payment_status', 'completed'),
    ])

    // Calculate effective limit (custom override or plan limit, default is 1)
    const effectiveLimit = profile?.custom_stories_per_month ?? profile?.stories_per_month ?? 1

    return NextResponse.json({
      ...profile,
      characters_count: charactersResult.count || 0,
      stories_generated_total: storybooksResult.count || 0,
      storybooks_purchased: purchasedStorybooksResult.count || 0,
      effective_stories_per_month: effectiveLimit,
      remaining_stories_this_month: Math.max(0, effectiveLimit - (profile?.stories_generated_this_month || 0)),
      story_credits: profile?.story_credits || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/profile
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url } = body

    const supabase = createServerClient(request.headers.get('authorization'))
    
    const updates: any = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.data.user?.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
