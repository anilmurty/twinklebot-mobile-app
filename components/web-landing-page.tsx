"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { 
  Sparkles, 
  Camera, 
  BookOpen, 
  Wand2, 
  ChevronRight,
  Star,
  Check,
  Menu,
  X
} from "lucide-react"

export function WebLandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message || "Sign in failed")
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

  const storyTemplates = [
    {
      title: "A Day at the Zoo",
      description: "An adventure with friendly animals",
      image: "/zoo-entrance-background.jpeg",
    },
    {
      title: "Counting Adventures",
      description: "Learn numbers 1-10 with fun",
      image: "/colorful-counting-storybook-cover.jpg",
    },
    {
      title: "Alphabet Journey",
      description: "Explore letters A to Z",
      image: "/alphabet-learning-book-cover.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-emerald-50/20">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-amber-200/50 bg-white/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
                Twinklebot
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-amber-900/70 hover:text-amber-900 transition-colors font-medium">
                How It Works
              </a>
              <a href="#stories" className="text-amber-900/70 hover:text-amber-900 transition-colors font-medium">
                Stories
              </a>
              <a href="#pricing" className="text-amber-900/70 hover:text-amber-900 transition-colors font-medium">
                Pricing
              </a>
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/app">
                <Button variant="ghost" className="text-amber-900 hover:bg-amber-100">
                  Sign In
                </Button>
              </Link>
              <Link href="/app">
                <Button className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-lg shadow-primary/25 px-6">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-amber-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-amber-200/50 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              <a href="#how-it-works" className="block py-2 text-amber-900/70 hover:text-amber-900 font-medium">
                How It Works
              </a>
              <a href="#stories" className="block py-2 text-amber-900/70 hover:text-amber-900 font-medium">
                Stories
              </a>
              <a href="#pricing" className="block py-2 text-amber-900/70 hover:text-amber-900 font-medium">
                Pricing
              </a>
              <div className="pt-3 border-t border-amber-200/50 space-y-2">
                <Link href="/app" className="block">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/app" className="block">
                  <Button className="w-full bg-gradient-to-r from-primary to-amber-500 text-amber-950 font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                AI-Powered Personalization
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 bg-clip-text text-transparent">
                  Storybooks Where
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Your Child Is The Hero
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-amber-900/70 mb-8 max-w-xl mx-auto lg:mx-0">
                Upload a photo, choose a story, and watch as AI creates a magical, 
                personalized storybook featuring your child as the main character.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/app">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                  >
                    Create Your First Story
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto border-amber-300 text-amber-900 hover:bg-amber-100 h-14 px-8 text-lg"
                  >
                    See How It Works
                  </Button>
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-800"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-amber-900/60">Loved by parents everywhere</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-amber-900/20 border-4 border-white">
                <Image
                  src="/happy-children-reading-colorful-storybooks-togethe.jpg"
                  alt="Children reading personalized storybooks"
                  width={600}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Floating card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900">Emma&apos;s Zoo Adventure</p>
                      <p className="text-sm text-amber-700/60">Just generated!</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/30 to-amber-300/30 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-emerald-300/30 to-teal-300/30 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-4">
              Create Magic in 3 Simple Steps
            </h2>
            <p className="text-lg text-amber-800/60 max-w-2xl mx-auto">
              Transform your child into a storybook hero in minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Camera,
                title: "Upload a Photo",
                description: "Simply take or upload a clear photo of your child. Our AI will learn their likeness.",
                color: "from-blue-500 to-indigo-600",
                bgColor: "bg-blue-50",
              },
              {
                icon: BookOpen,
                title: "Choose a Story",
                description: "Pick from our library of educational templates - counting, alphabet, adventures, and more.",
                color: "from-emerald-500 to-teal-600",
                bgColor: "bg-emerald-50",
              },
              {
                icon: Wand2,
                title: "Watch the Magic",
                description: "Our AI generates beautiful illustrations with your child as the star of the story.",
                color: "from-primary to-amber-500",
                bgColor: "bg-amber-50",
              },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className={`${step.bgColor} rounded-3xl p-8 h-full transition-transform group-hover:-translate-y-2`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center font-bold text-amber-900">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-amber-900 mb-3">{step.title}</h3>
                  <p className="text-amber-800/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Templates Showcase */}
      <section id="stories" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-4">
              Educational Stories Kids Love
            </h2>
            <p className="text-lg text-amber-800/60 max-w-2xl mx-auto">
              Each story is designed to entertain while teaching valuable lessons.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {storyTemplates.map((template, index) => (
              <div 
                key={index}
                className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="aspect-[4/3] relative">
                  <Image
                    src={template.image}
                    alt={template.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-1">{template.title}</h3>
                  <p className="text-white/80 text-sm">{template.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/app">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-amber-500 text-amber-950 font-semibold shadow-lg shadow-primary/25 px-8"
              >
                Explore All Stories
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-4">
              Personalized Keepsakes, Forever Yours
            </h2>
            <p className="text-lg text-amber-800/60 max-w-2xl mx-auto">
              Create magical storybooks your child will treasure. Each story features 10 beautifully illustrated scenes with your child as the hero.
            </p>
          </div>

          {/* Free Preview Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl p-6 mb-10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-emerald-900">Try Before You Buy</h3>
                <p className="text-emerald-700/70 text-sm">Generate a free preview to see your child in the story before purchasing</p>
              </div>
              <Link href="/app" className="sm:ml-auto">
                <Button variant="outline" className="border-emerald-300 text-emerald-800 hover:bg-emerald-100">
                  Start Free Preview
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Single Storybook */}
            <div className="bg-white rounded-2xl shadow-lg border border-amber-200/50 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-amber-900 mb-1">Single Storybook</h3>
              <p className="text-amber-700/60 text-sm mb-4">One personalized adventure</p>
              <div className="text-3xl font-bold text-amber-900 mb-4">
                $7.99
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "1 personalized storybook",
                  "10 illustrated scenes",
                  "HD quality images",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 2-Story Bundle */}
            <div className="bg-white rounded-2xl shadow-lg border border-amber-200/50 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-amber-900 mb-1">2-Story Bundle</h3>
              <p className="text-amber-700/60 text-sm mb-4">Two adventures to enjoy</p>
              <div className="text-3xl font-bold text-amber-900 mb-1">
                $13.99
              </div>
              <p className="text-emerald-600 text-xs font-medium mb-4">Save $2</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "2 personalized storybooks",
                  "10 scenes each",
                  "Mix & match stories",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-100">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 3-Story Bundle */}
            <div className="bg-white rounded-2xl shadow-lg border border-amber-200/50 p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-gradient-to-r from-primary to-amber-500 text-amber-950 text-xs font-bold rounded-full shadow-md">
                  POPULAR
                </span>
              </div>
              <h3 className="text-lg font-bold text-amber-900 mb-1 mt-2">3-Story Bundle</h3>
              <p className="text-amber-700/60 text-sm mb-4">Perfect for bedtime variety</p>
              <div className="text-3xl font-bold text-amber-900 mb-1">
                $19.99
              </div>
              <p className="text-emerald-600 text-xs font-medium mb-4">Save $4</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "3 personalized storybooks",
                  "10 scenes each",
                  "Ideal for rotation",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button className="w-full bg-gradient-to-r from-primary to-amber-500 text-amber-950 font-semibold shadow-lg shadow-primary/25">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 4-Story Bundle - Best Value */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border-2 border-primary/30 p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-lg font-bold text-amber-900 mb-1 mt-2">Complete Library</h3>
              <p className="text-amber-700/60 text-sm mb-4">All 4 stories at launch</p>
              <div className="text-3xl font-bold text-amber-900 mb-1">
                $24.99
              </div>
              <p className="text-emerald-600 text-xs font-medium mb-4">Save $7</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "4 personalized storybooks",
                  "Complete starter collection",
                  "Maximum variety",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-amber-800 text-sm">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg">
                  Get Complete Library
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust message */}
          <div className="text-center mt-10">
            <p className="text-amber-700/60 text-sm">
              One-time purchase. No subscription required. Your storybooks are yours to keep forever.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-6">
            Ready to Make Your Child the Star?
          </h2>
          <p className="text-lg text-amber-800/60 mb-8 max-w-2xl mx-auto">
            Join thousands of parents who are creating magical memories with personalized storybooks.
          </p>
          <Link href="/app">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-xl shadow-primary/30 px-10 h-14 text-lg"
            >
              Create Your First Story
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-amber-200/50 bg-white/70 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-amber-900">Twinklebot</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-amber-800/60">
              <a href="#" className="hover:text-amber-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-amber-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-amber-900 transition-colors">Contact</a>
            </div>

            <p className="text-sm text-amber-800/60">
              &copy; {new Date().getFullYear()} Twinklebot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal (if needed for direct sign in from marketing page) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-900">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="p-2 rounded-full hover:bg-amber-100 transition-colors"
              >
                <X className="w-5 h-5 text-amber-700" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-amber-300 hover:bg-amber-50"
              >
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-amber-700/60">or</span>
                </div>
              </div>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-amber-50/50"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-amber-50/50"
              />

              <Button 
                onClick={handleEmailAuth} 
                disabled={isLoading} 
                className="w-full h-12 bg-gradient-to-r from-primary to-amber-500 text-amber-950 font-semibold"
              >
                {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-sm text-amber-700 hover:text-amber-900"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

