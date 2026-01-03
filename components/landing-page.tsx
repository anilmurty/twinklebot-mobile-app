"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function LandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
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

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (isSignUp) {
        await signUpWithEmail(email, password)
        alert("Account created! Please check your email to verify your account.")
      } else {
        await signInWithEmail(email, password)
      }
    } catch (error: any) {
      console.error("Email auth error:", error)
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/zoo-entrance-background.jpeg)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Sign in buttons at bottom 10% */}
        <div className="px-6 pb-8 space-y-3">
          {error && (
            <div className="mb-4 p-3 bg-red-500/90 backdrop-blur-sm rounded-2xl">
              <p className="text-sm text-white text-center">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSignInWithGoogle}
            disabled={isLoading}
            size="lg"
            className="w-full rounded-full h-14 text-base font-medium bg-[#F5C563] hover:bg-[#F5C563]/90 text-gray-900 border-none shadow-lg"
          >
            {isLoading ? "Signing in..." : "Login with Google"}
          </Button>

          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="w-full rounded-full h-14 text-base font-medium bg-transparent border-2 border-white text-white hover:bg-white/10 shadow-lg"
          >
            Login with Email
          </Button>
        </div>
      </div>

      {showEmailForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{isSignUp ? "Create Account" : "Sign In"}</h2>
              <button onClick={() => setShowEmailForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button onClick={handleEmailAuth} disabled={isLoading} className="w-full rounded-full h-12">
              {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
