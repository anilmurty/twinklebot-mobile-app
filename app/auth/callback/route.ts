import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  // Check for custom domain via environment variable or use request origin
  // Vercel sets x-forwarded-host header when using custom domains
  const customDomain = process.env.NEXT_PUBLIC_SITE_URL
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  
  // Prefer custom domain env var, then forwarded host (custom domain), then request origin
  let baseUrl = requestUrl.origin
  if (customDomain) {
    baseUrl = customDomain
  } else if (forwardedHost) {
    baseUrl = `${forwardedProto}://${forwardedHost}`
  }
  
  const redirectUrl = new URL(next, baseUrl)

  let supabaseResponse = NextResponse.redirect(redirectUrl)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL(`/?error=auth_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }
  }

  return supabaseResponse
}
