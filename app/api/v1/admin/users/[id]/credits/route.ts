import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * PATCH /api/v1/admin/users/:id/credits
 * Adjust a user's credits
 * Body: { field: "premium_credits" | "basic_credits", delta: number }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = 'then' in params ? await params : params
  const body = await request.json()
  const { field, delta } = body

  if (!['premium_credits', 'basic_credits'].includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }

  if (typeof delta !== 'number') {
    return NextResponse.json({ error: 'delta must be a number' }, { status: 400 })
  }

  // Read current values (include granted so we can increment it on positive deltas)
  const selectCols = field === 'premium_credits'
    ? 'premium_credits, premium_credits_granted'
    : field
  const { data: profile, error: readError } = await supabaseAdmin
    .from('profiles')
    .select(selectCols)
    .eq('id', id)
    .single()

  if (readError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const currentValue = (profile as any)[field] || 0
  const newValue = Math.max(0, currentValue + delta)

  const update: Record<string, number> = { [field]: newValue }

  // Track grants: only increment on positive admin adjustments to premium_credits.
  // Decrements (admin refund/clawback) do not reduce the "ever granted" total.
  let newGranted: number | undefined
  if (field === 'premium_credits' && delta > 0) {
    const currentGranted = (profile as any).premium_credits_granted || 0
    newGranted = currentGranted + delta
    update.premium_credits_granted = newGranted
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(update)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    [field]: newValue,
    ...(newGranted !== undefined ? { premium_credits_granted: newGranted } : {}),
  })
}
