"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
import { isDesignMode } from '@/lib/designMode'
import { useQueryClient } from '@tanstack/react-query'
import { del } from 'idb-keyval'
import { Capacitor } from '@capacitor/core'
import { setupDeepLinkHandler } from '@/lib/utils/deep-link-handler'
import { identifyUser as identifyRevenueCatUser, logoutUser as logoutRevenueCatUser } from '@/lib/services/iap-service'
import { trackEvent } from '@/lib/utils/analytics'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * After successful auth, check for intent=personalize or intent=notify in the URL
 * and handle accordingly (record interest or redirect to personalization).
 */
async function handlePostAuthIntent(userId: string, accessToken: string) {
  if (typeof window === 'undefined') return

  // Read intent from sessionStorage (stashed before OAuth redirect)
  const intent = window.sessionStorage.getItem('auth_intent')
  const storySlug = window.sessionStorage.getItem('auth_intent_story')
  if (!intent || !storySlug) return

  // Clear immediately to prevent re-processing
  window.sessionStorage.removeItem('auth_intent')
  window.sessionStorage.removeItem('auth_intent_story')

  if (intent === 'notify') {
    // Look up template ID from slug, then record interest
    try {
      const res = await fetch(`/api/v1/story-templates/by-slug/${encodeURIComponent(storySlug)}`)
      if (res.ok) {
        const template = await res.json()
        if (template.id && !template.user_interested) {
          await fetch('/api/v1/story-interest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ template_id: template.id }),
          })
        }
      }
    } catch (err) {
      console.error('[Intent] Failed to record story interest:', err)
    }
  } else if (intent === 'personalize') {
    // Redirect to the story library tab — the user can pick a character and start
    // The story slug is passed so the app can pre-select the template
    try {
      const res = await fetch(`/api/v1/story-templates/by-slug/${encodeURIComponent(storySlug)}`)
      if (res.ok) {
        const template = await res.json()
        if (template.id) {
          // Navigate to the app with the template pre-selected
          window.location.href = `/app?tab=storybooks&template=${template.id}`
          return
        }
      }
    } catch (err) {
      console.error('[Intent] Failed to look up template for personalization:', err)
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // ✅ DESIGN_MODE: Use centralized design mode check
  const designMode = isDesignMode()
  
  // Create client inside component to ensure fresh cookie access
  const supabase = useMemo(() => {
    // In design mode, createClient returns null, so handle that
    if (designMode) {
      return null as any
    }
    
    try {
      return createClient()
    } catch (error) {
      // If client creation fails and we're in design mode, return null
      if (isDesignMode()) {
        console.warn('Design mode: Supabase client creation skipped')
        return null as any
      }
      throw error
    }
  }, [designMode])

  useEffect(() => {
    let mounted = true

    // ✅ DESIGN_MODE: Skip auth in design mode
    if (designMode) {
      // Provide a mock user so the app renders
      setUser({
        id: 'design-mode-user-id',
        email: 'design@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User)
      setLoading(false)
      return
    }

    // Get initial session
    supabase?.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      
      if (error) {
        // If refresh token is invalid, clear session
        if (error.message?.includes('Refresh Token')) {
          console.warn('Invalid refresh token, clearing session:', error.message)
          supabase?.auth.signOut().catch(() => {})
          setUser(null)
        } else {
          console.error('Session error:', error)
        }
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }).catch((error) => {
      if (!mounted) return
      console.error('Failed to get session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        logoutRevenueCatUser()
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
        if (session?.user?.id) {
          identifyRevenueCatUser(session.user.id)
        }
        try {
          if (typeof window !== 'undefined') {
            const method = window.sessionStorage.getItem('auth_method_in_progress') ?? undefined
            const startedAtRaw = window.sessionStorage.getItem('auth_started_at')
            const startedAt = startedAtRaw ? Number(startedAtRaw) : NaN
            const time_to_complete_seconds = Number.isFinite(startedAt)
              ? Math.round((Date.now() - startedAt) / 1000)
              : undefined
            trackEvent('auth_completed', { method, time_to_complete_seconds })
            window.sessionStorage.removeItem('auth_method_in_progress')
            window.sessionStorage.removeItem('auth_started_at')
          }
        } catch {}
        // Handle post-auth intent (personalize / notify)
        if (session?.user?.id) {
          handlePostAuthIntent(session.user.id, session.access_token)
        }
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }) || { data: { subscription: { unsubscribe: () => {} } } }

    // Set up deep link handler for native OAuth callback
    if (supabase) {
      setupDeepLinkHandler(supabase)
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [supabase, designMode])

  const signInWithGoogle = async () => {
    // ✅ DESIGN_MODE: Skip auth in design mode
    if (designMode) {
      console.warn('Design mode: signInWithGoogle skipped')
      return
    }

    if (Capacitor.isNativePlatform()) {
      // Native: open OAuth in system browser, redirect back via deep link
      const { data, error } = await supabase?.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'twinklebot://auth/callback',
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) throw error
      if (data?.url) {
        const { Browser } = await import('@capacitor/browser')
        await Browser.open({ url: data.url })
      }
    } else {
      // Web: standard OAuth redirect
      const { error } = await supabase?.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (error) throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    // ✅ DESIGN_MODE: Skip auth in design mode
    if (designMode) {
      console.warn('Design mode: signInWithEmail skipped')
      return
    }
    const { error } = await supabase?.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string) => {
    // ✅ DESIGN_MODE: Skip auth in design mode
    if (designMode) {
      console.warn('Design mode: signUpWithEmail skipped')
      return
    }
    const { error } = await supabase?.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    // ✅ DESIGN_MODE: Just clear local state in design mode
    if (designMode) {
      setUser(null)
      return
    }

    // Logout from RevenueCat
    await logoutRevenueCatUser()

    // Clear React Query cache to prevent data leaking between users
    queryClient.clear()
    // Also clear IndexedDB persisted cache
    try {
      await del('twinklebot-query-cache')
    } catch (e) {
      console.warn('Failed to clear IndexedDB cache:', e)
    }

    // Clear session and sign out
    const { error } = await supabase?.auth.signOut()
    if (error) {
      // If sign out fails, clear local state anyway
      console.error('Sign out error:', error)
      setUser(null)
      // Force clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    } else {
      setUser(null)
    }
  }

  const getToken = async (): Promise<string | null> => {
    // ✅ DESIGN_MODE: Return null token in design mode
    if (designMode) {
      return null
    }
    try {
      const { data: { session }, error } = await supabase?.auth.getSession()
      if (error) {
        // If refresh token is invalid, clear session
        if (error.message?.includes('Refresh Token')) {
          console.warn('Invalid refresh token, clearing session')
          await supabase?.auth.signOut().catch(() => {})
          setUser(null)
          return null
        }
        throw error
      }
      return session?.access_token ?? null
    } catch (error: any) {
      console.error('Error getting token:', error)
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
