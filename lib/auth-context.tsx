"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client-browser'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // ✅ DESIGN_MODE: Check if we're in design mode (v0.dev or DESIGN_MODE env var)
  const isDesignMode = typeof window !== 'undefined' && 
    (window.location.hostname.includes('v0.dev') || 
     process.env.NEXT_PUBLIC_DESIGN_MODE === '1')
  
  // Create client inside component to ensure fresh cookie access
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch (error) {
      // In design mode, return null if client creation fails
      if (isDesignMode) {
        console.warn('Design mode: Supabase client creation skipped')
        return null as any
      }
      throw error
    }
  }, [isDesignMode])

  useEffect(() => {
    let mounted = true

    // ✅ DESIGN_MODE: Skip auth in design mode
    if (isDesignMode) {
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
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
      } else {
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }) || { data: { subscription: { unsubscribe: () => {} } } }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [supabase, isDesignMode])

  const signInWithGoogle = async () => {
    // ✅ DESIGN_MODE: Skip auth in design mode
    if (isDesignMode) {
      console.warn('Design mode: signInWithGoogle skipped')
      return
    }
    // Use window.location.origin which will be the custom domain if accessed via custom domain
    // Supabase will respect the redirectTo parameter, but the Site URL in Supabase config
    // determines the final redirect domain
    const { error } = await supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string, password: string) => {
    // ✅ DESIGN_MODE: Skip auth in design mode
    if (isDesignMode) {
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
    if (isDesignMode) {
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
    if (isDesignMode) {
      setUser(null)
      return
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
    if (isDesignMode) {
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
