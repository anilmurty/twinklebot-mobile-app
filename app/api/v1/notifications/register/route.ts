import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/notifications/register
 * Register a device token for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.data.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, platform } = body

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    const validPlatforms = ['ios', 'android']
    if (platform && !validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Upsert: insert or update updated_at on conflict
    const { error } = await supabaseAdmin
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          token: token.trim(),
          platform: platform || 'ios',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,token' }
      )

    if (error) {
      console.error('[NOTIFICATIONS] Failed to register token:', error.message)
      return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[NOTIFICATIONS] Register error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
