import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

function summarizeUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null
  if (/\bFBAN\b|\bFBAV\b|\bFB_IAB\b/i.test(ua)) return 'Facebook in-app'
  if (/Instagram|Threads/i.test(ua)) return 'Instagram/Threads in-app'
  if (/musical_ly|BytedanceWebview/i.test(ua)) return 'TikTok in-app'
  if (/Snapchat/i.test(ua)) return 'Snapchat in-app'
  if (/LinkedInApp/i.test(ua)) return 'LinkedIn in-app'
  if (/\bwv\)/i.test(ua) && /Android/.test(ua)) return 'Android Webview'
  if (/iPhone|iPad/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) return 'iOS Safari'
  if (/iPhone|iPad/.test(ua) && /CriOS/.test(ua)) return 'iOS Chrome'
  if (/Android/.test(ua) && /Chrome/.test(ua)) return 'Android Chrome'
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome/.test(ua)) return 'Mac Safari'
  if (/Chrome/.test(ua)) return 'Desktop Chrome'
  if (/Firefox/.test(ua)) return 'Firefox'
  return ua.slice(0, 60)
}

/**
 * POST /api/v1/internal/signup-context
 *
 * Called fire-and-forget by the web client right after SIGNED_IN, so we can
 * record request-side context (IP / geo / user-agent / source LP) for the
 * admin signup alert. Server-side because client can't see its own IP.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request)
  const user = auth?.data?.user
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { lp_source?: string; referrer?: string } = {}
  try {
    body = await request.json()
  } catch {}

  const headers = request.headers
  const userAgent = headers.get('user-agent') || null
  const ipAddress =
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  const country = headers.get('x-vercel-ip-country') || null
  const region = headers.get('x-vercel-ip-country-region') || null
  const city = headers.get('x-vercel-ip-city')
    ? decodeURIComponent(headers.get('x-vercel-ip-city')!)
    : null

  const row = {
    user_id: user.id,
    ip_address: ipAddress,
    country,
    region,
    city,
    user_agent: userAgent,
    ua_summary: summarizeUserAgent(userAgent),
    lp_source: body.lp_source || null,
    referrer: body.referrer || null,
  }

  const { error } = await (supabaseAdmin as any)
    .from('signup_diagnostics')
    .upsert(row, { onConflict: 'user_id' })

  if (error) {
    console.error('[signup-context] upsert failed', error)
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
