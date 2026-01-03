import { createClient } from '@supabase/supabase-js'
import { isDesignMode } from '@/lib/designMode'

// Lazy-loaded admin client to avoid module-level env var access
// This prevents v0 from trying to access env vars at import time
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseAdminClient() {
  // In design mode, API routes shouldn't be called, but if they are, throw a clear error
  if (isDesignMode()) {
    throw new Error('Supabase admin client not available in design mode. API routes should not be called.')
  }

  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  // Only access env vars when actually needed (not at module load time)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return _supabaseAdmin
}

// Export as a getter to avoid module-level evaluation
// This allows v0 to import the module without accessing env vars
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseAdminClient() as any)[prop]
  }
})

/**
 * Create server client for API routes (uses user's JWT)
 * Returns null in design mode (but API routes shouldn't be called in design mode anyway)
 */
export function createServerClient(authHeader: string | null) {
  if (isDesignMode()) {
    return null as any
  }

  // Only access env vars when function is called (not at module load time)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader || '',
      },
    },
  })
}
