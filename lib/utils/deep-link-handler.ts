import { Capacitor } from '@capacitor/core'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sets up deep link handling for native OAuth callback.
 * When the system browser redirects to twinklebot://auth/callback?code=...,
 * Capacitor fires an appUrlOpen event. We intercept it, exchange the code
 * for a session, and close the browser.
 */
export function setupDeepLinkHandler(supabase: SupabaseClient) {
  if (!Capacitor.isNativePlatform()) return

  import('@capacitor/app').then(({ App }) => {
    App.addListener('appUrlOpen', async (event) => {
      try {
        const url = new URL(event.url)

        // Handle OAuth callback
        if (url.pathname === '/auth/callback' || url.host === 'auth') {
          const code = url.searchParams.get('code')
          if (code) {
            await supabase.auth.exchangeCodeForSession(code)
          }

          // Close the system browser
          try {
            const { Browser } = await import('@capacitor/browser')
            await Browser.close()
          } catch {
            // Browser might already be closed
          }
        }
      } catch (err) {
        console.error('Deep link handler error:', err)
      }
    })
  })
}
