import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserAlert } from '@/lib/services/admin-alerts'
import { supabaseAdmin } from '@/lib/supabase/server'

function summarizeUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null
  // Order matters: WebView checks first (they also include Safari/Chrome strings)
  if (/\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i.test(ua)) return 'Facebook in-app'
  if (/Instagram|Threads/i.test(ua)) return 'Instagram/Threads in-app'
  if (/musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok in-app'
  if (/wv\)|; wv\)|Android.*Version\/[\d.]+ Chrome/i.test(ua) && /Android/.test(ua)) return 'Android Webview'
  if (/iPhone|iPad/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) return 'iOS Safari'
  if (/Android/.test(ua) && /Chrome/.test(ua)) return 'Android Chrome'
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)) return 'Mac Safari'
  if (/Chrome/.test(ua)) return 'Desktop Chrome'
  if (/Firefox/.test(ua)) return 'Firefox'
  return ua.slice(0, 60)
}

async function fetchSignupContext(userId: string): Promise<{
  provider: string | null
  fullName: string | null
  ipAddress: string | null
  country: string | null
  userAgentSummary: string | null
}> {
  const out = {
    provider: null as string | null,
    fullName: null as string | null,
    ipAddress: null as string | null,
    country: null as string | null,
    userAgentSummary: null as string | null,
  }

  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
    const user = data?.user as any
    if (user) {
      out.provider = user.app_metadata?.provider || user.raw_app_meta_data?.provider || null
      out.fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.raw_user_meta_data?.full_name ||
        null
    }
  } catch (err) {
    console.error('[webhook:new-user] getUserById failed', err)
  }

  // The most recent auth.audit_log_entries row for this user has the IP + UA
  // from the signup request. Service role can read auth schema directly via RPC.
  try {
    const { data } = await (supabaseAdmin as any).rpc('get_signup_audit', { p_user_id: userId })
    const row = Array.isArray(data) ? data[0] : data
    if (row) {
      out.ipAddress = row.ip_address || null
      out.userAgentSummary = summarizeUserAgent(row.user_agent)
    }
  } catch {
    // RPC may not exist yet — non-fatal
  }

  if (out.ipAddress) {
    try {
      const res = await fetch(`https://ipapi.co/${out.ipAddress}/country_name/`, {
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const text = (await res.text()).trim()
        if (text && !text.toLowerCase().startsWith('error')) out.country = text
      }
    } catch {
      // geolocation lookup is best-effort
    }
  }

  return out
}

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

  const context = await fetchSignupContext(record.id)

  await sendNewUserAlert({
    userId: record.id,
    email: record.email,
    createdAt: record.created_at || new Date().toISOString(),
    ...context,
  })

  return NextResponse.json({ ok: true })
}
