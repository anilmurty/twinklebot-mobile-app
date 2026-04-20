import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/admin/users/[id]/details
 * Returns storybooks and characters for a specific user (admin drill-down).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: userId } = await params

  const [storybooksRes, charactersRes] = await Promise.all([
    supabaseAdmin
      .from('storybooks')
      .select('id, title, status, payment_status, error_message, quality_tier, style, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('characters')
      .select('id, name, avatar_status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (storybooksRes.error) {
    return NextResponse.json({ error: storybooksRes.error.message }, { status: 500 })
  }
  if (charactersRes.error) {
    return NextResponse.json({ error: charactersRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    storybooks: storybooksRes.data || [],
    characters: charactersRes.data || [],
  })
}
