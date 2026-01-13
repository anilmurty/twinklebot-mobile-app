"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Users, BookOpen, Sparkles } from "lucide-react"

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

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen justify-center items-center px-4 py-8">
        {/* Logo/Brand at top - absolute positioned */}
        <div className="absolute top-0 left-0 right-0 pt-8 px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-[#F5C563]" />
            <span className="text-white font-semibold text-lg">Twinklebot</span>
          </div>
        </div>

        {/* Login Card - Centered */}
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 w-full shadow-2xl">
            <h2 className="text-xl font-bold text-center mb-1">Welcome to Twinklebot</h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              Create personalized storybooks for your child
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/90 rounded-2xl">
                <p className="text-sm text-white text-center">{error}</p>
              </div>
            )}

            {!showEmailForm ? (
              <>
                {/* Login buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSignInWithGoogle}
                    disabled={isLoading}
                    size="lg"
                    className="w-full rounded-full h-12 text-base font-medium bg-[#F5C563] hover:bg-[#F5C563]/90 text-gray-900"
                  >
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </Button>

                  <Button
                    onClick={() => setShowEmailForm(true)}
                    variant="outline"
                    size="lg"
                    disabled={isLoading}
                    className="w-full rounded-full h-12 text-base font-medium border-gray-300"
                  >
                    Continue with Email
                  </Button>
                </div>

                {/* How It Works - compact version */}
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wide font-medium">How it works</p>
                  <div className="flex justify-between gap-2">
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1.5">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Upload Photo</p>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-1.5">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Choose Story</p>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-1.5">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Generate</p>
                    </div>
                  </div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-base"
                  />

                  <Button 
                    onClick={handleEmailAuth} 
                    disabled={isLoading} 
                    className="w-full rounded-full h-12 text-base font-medium bg-[#F5C563] hover:bg-[#F5C563]/90 text-gray-900"
                  >
                    {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>

                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full text-center text-sm text-primary hover:underline"
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>

                  <button
                    onClick={() => {
                      setShowEmailForm(false)
                      setError(null)
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Back to login options
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
