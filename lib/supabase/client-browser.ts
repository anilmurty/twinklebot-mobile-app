import { createBrowserClient } from '@supabase/ssr'
import { isDesignMode } from '@/lib/designMode'

/**
 * Create Supabase browser client
 * Returns null in design mode to prevent crashes when env vars are missing
 */
export function createClient() {
  // Never construct Supabase client in design mode
  if (isDesignMode()) {
    return null as any
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). ' +
      'Please add them to your .env.local file. ' +
      'Get your Supabase credentials from https://app.supabase.com'
    )
  }

  return createBrowserClient(url, key)
}
