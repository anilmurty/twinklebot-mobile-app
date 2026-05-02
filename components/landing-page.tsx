"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Lock } from "lucide-react"
import { trackEvent, trackAuthEvent, trackAuthError } from "@/lib/utils/analytics"
import { isInAppBrowser } from "@/lib/utils/in-app-browser"

const FB_AUTH_ENABLED = process.env.NEXT_PUBLIC_FB_AUTH_ENABLED === "true"

function markAuthStart(method: "google" | "email" | "facebook") {
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("auth_method_in_progress", method)
      window.sessionStorage.setItem("auth_started_at", String(Date.now()))
    }
  } catch {}
}

export function LandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const inWebView = useMemo(() => isInAppBrowser(), [])
  // FB/IG WebViews break Google OAuth, so default new users to the email
  // form. Existing-flow users on real browsers see the previous Google-first
  // layout unchanged.
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [intentBanner, setIntentBanner] = useState<string | null>(null)
  const methodAttemptedRef = useRef<string | null>(null)
  const completedRef = useRef(false)
  const idleFiredRef = useRef(false)
  const lastInteractionRef = useRef<number>(typeof window !== "undefined" ? Date.now() : 0)
  const fieldErrorsFiredRef = useRef<Set<string>>(new Set())

  const reportFieldError = (field: "email" | "password" | "confirm_password", reason: string) => {
    const key = `${field}:${reason}`
    if (fieldErrorsFiredRef.current.has(key)) return
    fieldErrorsFiredRef.current.add(key)
    trackEvent("auth_form_field_error", { field, reason })
  }

  const handleEmailBlur = () => {
    if (!email) return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      reportFieldError("email", "invalid_format")
    }
  }
  const handlePasswordBlur = () => {
    if (!password) return
    if (password.length < 6) reportFieldError("password", "too_short")
  }
  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) return
    if (password && confirmPassword !== password) reportFieldError("confirm_password", "mismatch")
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    trackEvent("auth_page_viewed", {
      referrer: document.referrer || undefined,
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      in_app_browser: inWebView,
    })

    if (inWebView) {
      // Default WebView users to the email signup form, since Google OAuth
      // is unreliable here. They came from an ad, so default to sign-up mode.
      trackEvent("auth_form_in_webview", { user_agent: navigator.userAgent.slice(0, 100) })
      setShowEmailForm(true)
      setIsSignUp(true)
    }

    // Stash intent params for post-auth handling
    const intent = params.get("intent")
    const story = params.get("story")
    if (intent && story) {
      window.sessionStorage.setItem("auth_intent", intent)
      window.sessionStorage.setItem("auth_intent_story", story)
      const storyName = story.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      if (intent === "notify") {
        setIntentBanner(`Sign up to be notified when "${storyName}" is ready`)
      } else if (intent === "personalize") {
        setIntentBanner(`Sign up to personalize "${storyName}" with your child`)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden" && methodAttemptedRef.current && !completedRef.current) {
        trackEvent("auth_abandoned", { method_attempted: methodAttemptedRef.current })
      }
      // While hidden, freeze the idle clock (don't count tab-switch time).
      if (document.visibilityState === "visible") {
        lastInteractionRef.current = Date.now()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    // auth_form_idle: fire once if the user sits on the auth screen for 60s
    // of foreground time without any interaction and without picking a method.
    const resetIdle = () => { lastInteractionRef.current = Date.now() }
    const interactionEvents: (keyof DocumentEventMap)[] = [
      "click", "keydown", "input", "touchstart", "scroll",
    ]
    interactionEvents.forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }))

    const idleInterval = window.setInterval(() => {
      if (idleFiredRef.current) return
      if (document.visibilityState !== "visible") return
      if (methodAttemptedRef.current) return
      if (Date.now() - lastInteractionRef.current >= 60_000) {
        idleFiredRef.current = true
        trackEvent("auth_form_idle", { idle_seconds: 60 })
      }
    }, 5_000)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      interactionEvents.forEach((ev) => document.removeEventListener(ev, resetIdle))
      window.clearInterval(idleInterval)
    }
  }, [inWebView])

  const handleSignInWithGoogle = async () => {
    try {
      methodAttemptedRef.current = "google"
      trackEvent("auth_method_selected", { method: "google" })
      markAuthStart("google")
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
      completedRef.current = true
    } catch (error: any) {
      console.error("Sign in error:", error)
      trackAuthError({
        step: "oauth_launch",
        method: "google",
        error_code: error?.code,
        error_message: error?.message,
      })
      if (error.message?.includes("provider is not enabled")) {
        setError("Google sign-in is not enabled. Please use email/password or enable Google OAuth in Supabase.")
      } else {
        setError(`Sign in failed: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithFacebook = async () => {
    try {
      methodAttemptedRef.current = "facebook"
      trackEvent("auth_method_selected", { method: "facebook" })
      markAuthStart("facebook")
      setIsLoading(true)
      setError(null)
      const { createClient } = await import("@/lib/supabase/client-browser")
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      completedRef.current = true
    } catch (error: any) {
      console.error("Facebook sign in error:", error)
      trackAuthError({
        step: "oauth_launch",
        method: "facebook",
        error_code: error?.code,
        error_message: error?.message,
      })
      setError(`Sign in failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    try {
      methodAttemptedRef.current = "email"
      trackAuthEvent("auth_email_submitted", { email })
      markAuthStart("email")
      setIsLoading(true)
      setError(null)
      if (isSignUp) {
        if (password !== confirmPassword) {
          trackAuthError({ step: "email_signup", method: "email", error_code: "password_mismatch" })
          setError("Passwords do not match")
          return
        }
        await signUpWithEmail(email, password)
        // Email confirmation is disabled in Supabase, so the user is signed
        // in immediately. Auth state change handler will navigate them
        // forward — no confirmation alert needed (it added friction and
        // misled users who could already use the app).
      } else {
        await signInWithEmail(email, password)
      }
      completedRef.current = true
    } catch (error: any) {
      console.error("Email auth error:", error)
      trackAuthError({
        step: isSignUp ? "email_signup" : "email_signin",
        method: "email",
        error_code: error?.code,
        error_message: error?.message,
      })
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background image */}
      <Image
        src="/zoo-entrance-background.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center -z-10"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Mobile-only intent banner — positioned between the "Welcome" sign
          and the child's face in the background, so the kid's expression
          stays visible. Desktop renders the banner inline in the card. */}
      {intentBanner && (
        <div className="absolute left-4 right-4 top-[33vh] z-20 sm:hidden">
          <div className="max-w-md mx-auto p-2.5 bg-black/60 backdrop-blur-sm border border-primary/40 rounded-2xl">
            <p className="text-sm text-white text-center">{intentBanner}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen justify-end sm:justify-center items-center px-4 pb-10 sm:py-8">

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="p-5 w-full">

            {intentBanner && (
              <div className="hidden sm:block mb-3 p-2.5 bg-black/60 backdrop-blur-sm border border-primary/40 rounded-2xl">
                <p className="text-sm text-white text-center">{intentBanner}</p>
              </div>
            )}

            {error && (
              <div className="mb-3 p-2.5 bg-red-500/90 rounded-2xl">
                <p className="text-sm text-white text-center">{error}</p>
              </div>
            )}

            {!showEmailForm ? (
              <>
                {/* Login buttons */}
                <div className="space-y-3">
                  {FB_AUTH_ENABLED && (
                    <Button
                      onClick={handleSignInWithFacebook}
                      disabled={isLoading}
                      size="lg"
                      className="w-full rounded-full h-12 text-base font-medium bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                    >
                      {isLoading ? "Signing in..." : "Continue with Facebook"}
                    </Button>
                  )}

                  <Button
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                    size="lg"
                    className="w-full rounded-full h-12 text-base font-medium bg-[#F5C563] hover:bg-[#F5C563]/90 text-gray-900"
                  >
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </Button>

                  <Button
                    onClick={() => {
                      methodAttemptedRef.current = "email"
                      trackEvent("auth_method_selected", { method: "email" })
                      setShowEmailForm(true)
                    }}
                    variant="outline"
                    size="lg"
                    disabled={isLoading}
                    className="w-full rounded-full h-12 text-base font-medium border-white/60 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                  >
                    Continue with Email
                  </Button>
                </div>

                <p className="text-center text-xs text-white/50 mt-3">
                  By using TwinkleBot you agree to the{" "}
                  <a href="https://www.twinklebot.app/terms" className="underline text-white/70">Terms of Service</a>
                  {" "}and the{" "}
                  <a href="https://www.twinklebot.app/privacy" className="underline text-white/70">Privacy Policy</a>
                </p>

                <div className="mt-4 flex justify-center gap-4 text-[11px] text-white/70">
                  <span className="flex items-center gap-1"><span className="text-white/50">✓</span> No credit card</span>
                  <span className="flex items-center gap-1"><span className="text-white/50">✓</span> 50+ free stories</span>
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-white/50" /> Data stays yours</span>
                </div>
              </>
            ) : (
              <>
                {/* In WebView contexts, Google OAuth is blocked. Surface FB
                    Login at the top — most ad clicks come from inside FB's
                    own app where FB Login is one-tap. */}
                {inWebView && FB_AUTH_ENABLED && (
                  <div className="mb-4 space-y-2">
                    <Button
                      onClick={handleSignInWithFacebook}
                      disabled={isLoading}
                      size="lg"
                      className="w-full rounded-full h-12 text-base font-medium bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                    >
                      {isLoading ? "Signing in..." : "Continue with Facebook"}
                    </Button>
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex-1 h-px bg-white/20" />
                      <span className="text-[11px] uppercase tracking-wider text-white/60">or use email</span>
                      <div className="flex-1 h-px bg-white/20" />
                    </div>
                  </div>
                )}
                {/* Email form inline */}
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className="w-full px-4 py-3 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C563] text-base bg-white/90 text-gray-900 placeholder:text-gray-500"
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={handlePasswordBlur}
                    className="w-full px-4 py-3 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C563] text-base bg-white/90 text-gray-900 placeholder:text-gray-500"
                  />

                  {isSignUp && (
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={handleConfirmPasswordBlur}
                      className="w-full px-4 py-3 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C563] text-base bg-white/90 text-gray-900 placeholder:text-gray-500"
                    />
                  )}

                  <Button
                    onClick={handleEmailAuth}
                    disabled={isLoading}
                    className="w-full rounded-full h-12 text-base font-medium bg-[#F5C563] hover:bg-[#F5C563]/90 text-gray-900"
                  >
                    {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>

                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-center text-sm text-[#F5C563] hover:underline"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>

                  {!inWebView && (
                    <button
                      onClick={() => {
                        setShowEmailForm(false)
                        setError(null)
                      }}
                      className="w-full text-center text-sm text-white/70 hover:text-white"
                    >
                      ← Back to login options
                    </button>
                  )}

                  <p className="text-center text-xs text-white/60">
                    By using TwinkleBot you agree to the{" "}
                    <a href="https://www.twinklebot.app/terms" className="underline text-white/80">Terms of Service</a>
                    {" "}and the{" "}
                    <a href="https://www.twinklebot.app/privacy" className="underline text-white/80">Privacy Policy</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
