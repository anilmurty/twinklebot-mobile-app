import { createBrowserClient } from '@supabase/ssr'

// Check if we're in design mode (v0.dev or DESIGN_MODE env var)
const isDesignMode = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('v0.dev')
  }
  return process.env.DESIGN_MODE === "1"
}

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    // In design mode, return a dummy URL to prevent crashes
    if (isDesignMode()) {
      return 'https://placeholder.supabase.co'
    }
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file. ' +
      'Get your Supabase URL from https://app.supabase.com'
    )
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    // In design mode, return a dummy key to prevent crashes
    if (isDesignMode()) {
      return 'placeholder-anon-key'
    }
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file. ' +
      'Get your Supabase Anon Key from https://app.supabase.com'
    )
  }
  return key
}

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}
