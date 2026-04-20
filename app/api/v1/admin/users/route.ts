import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/admin/users
 * List all users with credit balances and counts
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, premium_credits, premium_credits_granted, basic_credits, story_credits, payment_override, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get storybook and character counts per user
  const { data: storybooks } = await supabaseAdmin
    .from('storybooks')
    .select('user_id, status, payment_status')

  const { data: characters } = await supabaseAdmin
    .from('characters')
    .select('user_id')

  const storybookCounts: Record<string, number> = {}
  const completedCounts: Record<string, number> = {}
  const consumedCounts: Record<string, number> = {}
  const statusBreakdown: Record<string, Record<string, number>> = {}
  for (const sb of storybooks || []) {
    storybookCounts[sb.user_id] = (storybookCounts[sb.user_id] || 0) + 1
    if (sb.status === 'completed') {
      completedCounts[sb.user_id] = (completedCounts[sb.user_id] || 0) + 1
    }
    if (sb.payment_status === 'completed') {
      consumedCounts[sb.user_id] = (consumedCounts[sb.user_id] || 0) + 1
    }
    if (!statusBreakdown[sb.user_id]) statusBreakdown[sb.user_id] = {}
    statusBreakdown[sb.user_id][sb.status] = (statusBreakdown[sb.user_id][sb.status] || 0) + 1
  }

  const characterCounts: Record<string, number> = {}
  for (const ch of characters || []) {
    characterCounts[ch.user_id] = (characterCounts[ch.user_id] || 0) + 1
  }

  const users = (profiles || []).map(p => ({
    ...p,
    total_credits: (p.premium_credits || 0) + (p.basic_credits || 0) + (p.story_credits || 0),
    storybook_count: storybookCounts[p.id] || 0,
    completed_count: completedCounts[p.id] || 0,
    consumed_credits: consumedCounts[p.id] || 0,
    status_breakdown: statusBreakdown[p.id] || {},
    character_count: characterCounts[p.id] || 0,
  }))

  return NextResponse.json({ users })
}
