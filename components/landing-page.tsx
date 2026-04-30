"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Lock } from "lucide-react"
import { trackEvent, trackAuthEvent } from "@/lib/utils/analytics"

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
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [intentBanner, setIntentBanner] = useState<string | null>(null)
  const methodAttemptedRef = useRef<string | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    trackEvent("auth_page_viewed", {
      referrer: document.referrer || undefined,
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
    })

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
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [])

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
          setError("Passwords do not match")
          return
        }
        await signUpWithEmail(email, password)
        alert("Account created! Please check your email to verify your account.")
      } else {
        await signInWithEmail(email, password)
      }
      completedRef.current = true
    } catch (error: any) {
      console.error("Email auth error:", error)
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/zoo-entrance-background.jpeg)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen justify-end sm:justify-center items-center px-4 pb-10 sm:py-8">

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="p-5 w-full">

            {intentBanner && (
              <div className="mb-3 p-2.5 bg-black/60 backdrop-blur-sm border border-primary/40 rounded-2xl">
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
                {/* Email form inline */}
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C563] text-base bg-white/90 text-gray-900 placeholder:text-gray-500"
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#F5C563] text-base bg-white/90 text-gray-900 placeholder:text-gray-500"
                  />

                  {isSignUp && (
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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

                  <button
                    onClick={() => {
                      setShowEmailForm(false)
                      setError(null)
                    }}
                    className="w-full text-center text-sm text-white/70 hover:text-white"
                  >
                    ← Back to login options
                  </button>

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
