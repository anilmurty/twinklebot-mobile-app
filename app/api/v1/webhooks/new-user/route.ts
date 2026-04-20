import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserAlert } from '@/lib/services/admin-alerts'

/**
 * POST /api/v1/webhooks/new-user
 *
 * Supabase Database Webhook target. Fires once per INSERT on the `profiles` table.
 *
 * Expected payload (Supabase webhook format):
 *   {
 *     "type": "INSERT",
 *     "table": "profiles",
 *     "record": { "id": "...", "email": "...", "created_at": "..." },
 *     ...
 *   }
 *
 * Security: require SIGNUP_WEBHOOK_SECRET in an "Authorization: Bearer <secret>" header.
 * Configure the header in the Supabase webhook's HTTP headers section.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SIGNUP_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook:new-user] SIGNUP_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body?.type !== 'INSERT' || body?.table !== 'profiles') {
    return NextResponse.json({ ok: true, skipped: 'not a profiles INSERT' })
  }

  const record = body.record || {}
  if (!record.id || !record.email) {
    return NextResponse.json({ ok: true, skipped: 'missing id/email' })
  }

  await sendNewUserAlert({
    userId: record.id,
    email: record.email,
    createdAt: record.created_at || new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
