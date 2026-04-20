import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/admin/recent-failures
 * Returns last 50 failed or stuck storybooks across all users for platform-wide
 * issue detection (e.g. image provider outages).
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const STUCK_THRESHOLD_MS = 5 * 60 * 1000
  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString()

  const { data: storybooks, error } = await supabaseAdmin
    .from('storybooks')
    .select('id, user_id, title, status, payment_status, error_message, created_at, updated_at')
    .or(`status.eq.failed,and(status.eq.generating,updated_at.lt.${stuckCutoff})`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = Array.from(new Set((storybooks || []).map(s => s.user_id)))
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const emailById: Record<string, string> = {}
  for (const p of profiles || []) {
    emailById[p.id] = p.email
  }

  const items = (storybooks || []).map(s => ({
    ...s,
    email: emailById[s.user_id] || '(unknown)',
    is_stuck: s.status === 'generating',
  }))

  return NextResponse.json({ items })
}
