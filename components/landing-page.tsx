"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Sparkles, Users, Library, Mail } from "lucide-react"
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/login-background.png)",
          backgroundPosition: "center 35%",
        }}
      />

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-12 px-6 text-center">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-10 h-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Twinklebot</h1>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 text-balance">
          Transform your child into the hero of their own personalized storybook
        </p>

        {/* Sign In Section */}
        <Card className="w-full max-w-md p-6 space-y-4 bg-white/95 backdrop-blur-md shadow-xl rounded-3xl">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          {!showEmailForm ? (
            <div className="space-y-3">
              <Button
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                size="lg"
                className="w-full rounded-full h-14 text-base font-medium"
              >
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
              <Button
                onClick={() => setShowEmailForm(true)}
                variant="outline"
                size="lg"
                disabled={isLoading}
                className="w-full rounded-full h-14 text-base font-medium bg-white hover:bg-gray-50"
              >
                <Mail className="mr-2 h-5 w-5" />
                Sign in with Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <Button
                onClick={handleEmailAuth}
                disabled={isLoading || !email || !password}
                size="lg"
                className="w-full rounded-full h-14 text-base font-medium"
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? "Already have an account?" : "Create an account"}
                </button>
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="text-muted-foreground hover:underline"
                  disabled={isLoading}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* How It Works Section */}
        <div className="w-full max-w-md mt-6 space-y-2">
          <Card className="p-3 flex items-center gap-3 bg-white/70 backdrop-blur-sm border-white/40">
            <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">Create Characters</h3>
              <p className="text-xs text-muted-foreground">Upload your child's photo</p>
            </div>
          </Card>

          <Card className="p-3 flex items-center gap-3 bg-white/70 backdrop-blur-sm border-white/40">
            <div className="w-10 h-10 shrink-0 rounded-full bg-secondary/10 flex items-center justify-center">
              <Library className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">Choose a Story</h3>
              <p className="text-xs text-muted-foreground">Pick from educational templates</p>
            </div>
          </Card>

          <Card className="p-3 flex items-center gap-3 bg-white/70 backdrop-blur-sm border-white/40">
            <div className="w-10 h-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm">Generate & Enjoy</h3>
              <p className="text-xs text-muted-foreground">AI creates your unique storybook</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
