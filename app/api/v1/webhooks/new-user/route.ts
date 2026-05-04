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

async function fetchSignupDiagnostics(userId: string) {
  // The web client posts to /api/v1/internal/signup-context right after
  // SIGNED_IN, but the profiles INSERT (which fires this webhook) may land
  // first. Poll briefly to give the client time to write.
  for (let i = 0; i < 4; i++) {
    const { data } = await supabaseAdmin
      .from('signup_diagnostics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) return data as any
    await new Promise((r) => setTimeout(r, 800))
  }
  return null
}

async function fetchSignupContext(userId: string): Promise<{
  provider: string | null
  fullName: string | null
  ipAddress: string | null
  country: string | null
  userAgentSummary: string | null
  lpSource: string | null
}> {
  const out = {
    provider: null as string | null,
    fullName: null as string | null,
    ipAddress: null as string | null,
    country: null as string | null,
    userAgentSummary: null as string | null,
    lpSource: null as string | null,
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

  const diag = await fetchSignupDiagnostics(userId)
  if (diag) {
    out.ipAddress = diag.ip_address || null
    out.userAgentSummary =
      diag.ua_summary || summarizeUserAgent(diag.user_agent) || null
    const cityRegion = [diag.city, diag.region].filter(Boolean).join(', ')
    out.country = diag.country
      ? cityRegion
        ? `${diag.country} (${cityRegion})`
        : diag.country
      : null
    out.lpSource = diag.lp_source || null
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
