import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/admin/users/create
 * Create a test user with email/password
 * Body: { email: string, password: string }
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  try {
    // Create auth user (auto-confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // The handle_new_user trigger should create the profile with credits,
    // but create it explicitly as a fallback
    const { IS_EARLY_ACCESS } = await import('@/lib/config')
    const credits = IS_EARLY_ACCESS ? 1 : 0

    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        premium_credits: credits,
        premium_credits_granted: credits,
      }, { onConflict: 'id' })

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        premium_credits: credits,
      },
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
