import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // ✅ DESIGN_MODE: Bypass auth when DESIGN_MODE=1 or when accessed via v0.dev
  // This allows v0.dev to preview the app without requiring Supabase/auth setup
  const isDesignMode = process.env.DESIGN_MODE === "1" || 
                       request.headers.get('host')?.includes('v0.dev')
  
  if (isDesignMode) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

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
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // This ensures the session is refreshed on each request
  await supabase.auth.getUser()

  // Note: We don't redirect authenticated users from the landing page
  // The app handles showing different content based on auth state
  // If you need to protect routes in the future, add them here

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
