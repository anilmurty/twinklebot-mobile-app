"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { STORY_CATEGORIES, type StoryCategoryId } from "@/lib/story-constants"

export function WebLandingPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroImages = ["/hero-1.png", "/hero-2.png", "/hero-3.png"]

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  // Toggle to show/hide pricing section (for A/B testing)
  const showPricing = false

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
        if (password !== confirmPassword) {
          setError("Passwords do not match")
          return
        }
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const assetUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/story-template-assets/${path}`

  // All stories grouped by category (matching shared STORY_CATEGORIES)
  const storiesByCategory: Record<StoryCategoryId, { title: string; description: string; image: string }[]> = {
    language: [
      { title: "Alphabet Adventures A-I", description: "Explore letters A to I", image: assetUrl("alphabet-general/cover-a-through-i.png") },
      { title: "Alphabet Adventures J-R", description: "Explore letters J to R", image: assetUrl("alphabet-general/cover-j-through-r.png") },
      { title: "Alphabet Adventures S-Z", description: "Explore letters S to Z", image: assetUrl("alphabet-general/cover-s-through-z.png") },
      { title: "Colors of the Carnival", description: "A colorful celebration", image: assetUrl("colors-of-the-carnival/colors-of-the-carnival.png") },
      { title: "Opposites at the Playground", description: "Learn big and small", image: assetUrl("opposites-at-the-playground/opposites-at-the-playground.png") },
      { title: "The Feelings Farm", description: "Understand your emotions", image: assetUrl("the-feelings-farm/the-feelings-farm.png") },
      { title: "A Day in My Body", description: "Explore how your body works", image: assetUrl("a-day-in-my-body/a-day-in-my-body.png") },
      { title: "Vehicles on the Go", description: "Cars, trucks, and more", image: assetUrl("vehicles-on-the-go/vehicles-on-the-go.png") },
      { title: "Animals Around the World", description: "Meet animals everywhere", image: assetUrl("animals-around-the-world/animals-around-the-world.png") },
      { title: "Action Heroes", description: "Be a real-life hero", image: assetUrl("action-heroes/action-heroes.png") },
      { title: "My Five Senses Adventure", description: "See, hear, touch, taste, smell", image: assetUrl("my-five-senses-adventure/my-five-senses-adventure.png") },
      { title: "Weather Words", description: "Learn weather vocabulary", image: assetUrl("weather-words/weather-words.png") },
    ],
    math: [
      { title: "Counting Adventures", description: "Learn numbers 1-10 with fun", image: assetUrl("counting-general/counting-general.png") },
      { title: "The Great Bake Sale", description: "Bake and share treats", image: assetUrl("the-great-bake-sale/the-great-bake-sale.png") },
      { title: "Building a Birdhouse", description: "Create a home for birds", image: assetUrl("building-a-birdhouse/building-a-birdhouse.png") },
      { title: "Camping Under the Stars", description: "A nighttime adventure", image: assetUrl("camping-under-the-stars/camping-under-the-stars.png") },
      { title: "The Toy Store Sort", description: "Organize the toy store", image: assetUrl("the-toy-store-sort/the-toy-store-sort.png") },
      { title: "Race Day at the Track", description: "Ready, set, go!", image: assetUrl("race-day-at-the-track/race-day-at-the-track.png") },
      { title: "The Garden Grows", description: "Watch a garden bloom", image: assetUrl("the-garden-grows/the-garden-grows.png") },
      { title: "The Pizza Party Problem", description: "Solve a cheesy puzzle", image: assetUrl("the-pizza-party-problem/the-pizza-party-problem.png") },
      { title: "The Aquarium Helper", description: "Care for sea creatures", image: assetUrl("the-acquarium helper/the-acquarium helper.png") },
      { title: "The Big Shape City", description: "Shapes are everywhere", image: assetUrl("the-big-shape-city/the-big-shape-city.png") },
      { title: "Visit to the Farmers Market", description: "Discover fresh foods", image: assetUrl("visit-to-the-farmers-market/visit-to-the-farmers-market.png") },
    ],
    world: [
      { title: "A Day at the Zoo", description: "An adventure with friendly animals", image: assetUrl("day-at-the-zoo/day-at-the-zoo.png") },
      { title: "Field Trip to the Fire Station", description: "Learn about firefighters", image: assetUrl("field-trip-to-the-fire-station/field-trip-to-the-fire-station.png") },
      { title: "From Seed to Supermarket", description: "How food reaches you", image: assetUrl("from-seed-to-supermarket/from-seed-to-supermarket.png") },
      { title: "Under the Ocean", description: "Dive into the deep blue", image: assetUrl("under-the-ocean/under-the-ocean.png") },
      { title: "Into the Rainforest", description: "Explore the jungle", image: assetUrl("into-the-rainforest/into-the-rainforest.png") },
      { title: "The Construction Site", description: "Build something amazing", image: assetUrl("the-construction-site/the-construction-site.png") },
      { title: "Around the World in 10 Meals", description: "Taste global cuisines", image: assetUrl("around-the-world-in-10-meals/around-the-world-in-10-meals.png") },
      { title: "The Weather Station", description: "Predict the weather", image: assetUrl("the-weather-station/the-weather-station.png") },
      { title: "Night Sky Explorer", description: "Discover stars and planets", image: assetUrl("night-sky-explorer/night-sky-explorer.png") },
      { title: "The Hospital Helper", description: "Learn about doctors", image: assetUrl("the-hospital-helper/the-hospital-helper.png") },
      { title: "The River's Journey", description: "Follow a river to the sea", image: assetUrl("the-rivers-journey/the-rivers-journey.png") },
    ],
    science: [
      { title: "How a Volcano Works", description: "Explore erupting volcanoes", image: assetUrl("how-a-volcano-works/how-a-volcano-works.png") },
      { title: "Inside the Human Body", description: "Journey through organs", image: assetUrl("inside-the-human-body/inside-the-human-body.png") },
      { title: "The Life of a Butterfly", description: "Watch a metamorphosis", image: assetUrl("the-life-of-a-butterfly/the-life-of-a-butterfly.png") },
      { title: "Where Does Water Go?", description: "Follow the water cycle", image: assetUrl("where-does-water-go/where-does-water-go.png") },
      { title: "The Earthquake Investigator", description: "Discover what shakes the earth", image: assetUrl("the-earthquake-investigator/the-earthquake-investigator.png") },
      { title: "Light and Shadows", description: "Play with light", image: assetUrl("light-and-shadows/light-and-shadows.png") },
      { title: "The Magnetic World", description: "Discover magnets", image: assetUrl("the-magnetic-world/the-magnetic-world.png") },
      { title: "A Day in the Life of a Seed", description: "Watch a seed grow", image: assetUrl("a-day-in-the-life-of-a-seed/a-day-in-the-life-of-a-seed.png") },
      { title: "Forces All Around Us", description: "Discover push and pull", image: assetUrl("forces-all-around-us/forces-all-around-us.png") },
      { title: "The Deep Freeze", description: "Explore icy worlds", image: assetUrl("the-deep-freeze/the-deep-freeze.png") },
    ],
    scifi: [
      { title: "Mission To The Moon", description: "A space adventure", image: assetUrl("mission-to-the-moon/mission-to-the-moon.png") },
      { title: "The Time Traveler's Backpack", description: "Journey through time", image: assetUrl("the-time-travelers-backpack/the-time-travelers-backpack.png") },
      { title: "Planet of the Colors", description: "A colorful space trip", image: assetUrl("planet-of-the-colors/planet-of-the-colors.png") },
      { title: "The Dream Architect", description: "Design your dreams", image: assetUrl("the-dream-architect/the-dream-architect.png") },
      { title: "The Robot Best Friend", description: "Meet your robot pal", image: assetUrl("the-robot-best-friend/the-robot-best-friend.png") },
      { title: "Guardians of the Forest", description: "Protect the woodland", image: assetUrl("guardians-of-the-forest/guardians-of-the-forest.png") },
      { title: "The Cloud Castle", description: "Adventure in the clouds", image: assetUrl("the-cloud-castle/the-cloud-castle.png") },
      { title: "The Smallest Astronaut", description: "A tiny space explorer", image: assetUrl("the-smallest-astronaut/the-smallest-astronaut.png") },
      { title: "The Portal Map", description: "Travel through portals", image: assetUrl("the-portal-map/the-portal-map.png") },
      { title: "The Star Catcher", description: "Catch falling stars", image: assetUrl("the-star-catcher/the-star-catcher.png") },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-card/70 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Image
              src="/logo-horizontal.svg"
              alt="Twinklebot"
              width={240}
              height={128}
              className="h-10 sm:h-12 w-auto"
              style={{ filter: "brightness(1.6) saturate(1.2)" }}
              priority
            />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                How It Works
              </a>
              <a href="#stories" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Stories
              </a>
              {showPricing && (
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Pricing
                </a>
              )}
            </nav>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/app">
                <Button variant="ghost" className="text-foreground hover:bg-muted">
                  Sign In
                </Button>
              </Link>
              <Link href="/app">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-6">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-3">
              <a href="#how-it-works" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                How It Works
              </a>
              <a href="#stories" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                Stories
              </a>
              {showPricing && (
                <a href="#pricing" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                  Pricing
                </a>
              )}
              <div className="pt-3 border-t border-border space-y-2">
                <Link href="/app" className="block">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/app" className="block">
                  <Button className="w-full bg-primary text-primary-foreground font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section — Desktop: full-bleed image with text on dark left; Mobile: stacked */}
      <section className="relative">
        {/* Desktop: full-bleed background image with crossfade */}
        <div className="hidden lg:block relative min-h-[600px] xl:min-h-[680px]">
          {heroImages.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt="Parent and child experiencing TwinkleBot storybooks"
              fill
              className={`object-cover object-center transition-opacity duration-1000 ${i === heroIndex ? "opacity-100" : "opacity-0"}`}
              priority={i === 0}
            />
          ))}
          {/* Text overlay on the dark left side */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto w-full px-8 lg:px-12">
              <div className="max-w-lg">
                <h1 className="text-5xl xl:text-6xl font-bold leading-tight mb-8" style={{ fontFamily: "var(--font-display)" }}>
                  <span className="text-primary">
                    Storybooks Where
                  </span>
                  <br />
                  <span className="text-white">
                    Your Child Is
                  </span>
                  <br />
                  <span className="text-white">
                    A Hero
                  </span>
                </h1>

                <div className="flex gap-4">
                  <Link href="/app">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                    >
                      Create Your First Story
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 h-14 px-8 text-lg"
                    >
                      See How It Works
                    </Button>
                  </a>
                </div>

                <div className="mt-10 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-white/60">Loved by parents everywhere</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: stacked layout — image on top, text below */}
        <div className="lg:hidden">
          {/* Hero image on top — crossfade carousel */}
          <div className="relative w-full aspect-[16/9]">
            {heroImages.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt="Parent and child experiencing TwinkleBot storybooks"
                fill
                className={`object-cover object-right transition-opacity duration-1000 ${i === heroIndex ? "opacity-100" : "opacity-0"}`}
                priority={i === 0}
              />
            ))}
          </div>

          <div className="pt-8 pb-8 px-4 sm:px-6 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-primary">
                Storybooks Where
              </span>
              <br />
              <span className="text-white">
                Your Child Is The Hero
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                >
                  Create Your First Story
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-border text-foreground hover:bg-muted h-14 px-8 text-lg"
                >
                  See How It Works
                </Button>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-2 justify-center">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Loved by parents everywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Templates Showcase */}
      <section id="stories" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Educational Stories Kids Love
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each story is designed to entertain while teaching valuable lessons.
            </p>
          </div>

          {/* Carousel keyframes */}
          <style jsx>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes scroll-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
          `}</style>

          <div className="space-y-10">
            {STORY_CATEGORIES.map((cat, catIndex) => {
              const stories = storiesByCategory[cat.id]
              if (!stories || stories.length === 0) return null
              const direction = catIndex % 2 === 0 ? "scroll-left" : "scroll-right"
              const duration = `${Math.max(40, stories.length * 5)}s`
              return (
                <div key={cat.id}>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 pl-2" style={{ fontFamily: "var(--font-display)" }}>
                    {cat.label}
                  </h3>
                  <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-card/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-card/80 to-transparent" />
                    <div
                      className="flex gap-6 w-max hover:[animation-play-state:paused]"
                      style={{ animation: `${direction} ${duration} linear infinite` }}
                    >
                      {[...stories, ...stories].map((story, i) => (
                        <div
                          key={i}
                          className="group relative rounded-3xl overflow-hidden shadow-lg border border-border/50 flex-shrink-0 w-[280px] sm:w-[320px]"
                        >
                          <div className="aspect-[4/3] relative">
                            <Image
                              src={story.image}
                              alt={story.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h3 className="text-xl font-bold mb-1">{story.title}</h3>
                            <p className="text-white/80 text-sm">{story.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/app">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-8"
              >
                Explore All Stories
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Create Magic in 3 Simple Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              },
              {
                icon: BookOpen,
                title: "Choose a Story",
                description: "Pick from our library of educational templates - counting, alphabet, adventures, and more.",
                color: "from-secondary to-emerald-600",
              },
              {
                icon: Wand2,
                title: "Watch the Magic",
                description: "Our AI generates beautiful illustrations with your child as the star of the story.",
                color: "from-primary to-accent",
              },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-card rounded-3xl p-8 h-full transition-transform group-hover:-translate-y-2 border border-border/50">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted shadow flex items-center justify-center font-bold text-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {showPricing && (
      <section id="pricing" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Personalized Keepsakes, Forever Yours
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create magical storybooks your child will treasure. Each story features 10 beautifully illustrated scenes with your child as the hero.
            </p>
          </div>

          {/* Free Preview Banner */}
          <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6 mb-10 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-foreground">Try Before You Buy</h3>
                <p className="text-muted-foreground text-sm">Generate a free preview to see your child in the story before purchasing</p>
              </div>
              <Link href="/app" className="sm:ml-auto">
                <Button variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10">
                  Start Free Preview
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Single Storybook */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 flex flex-col">
              <h3 className="text-lg font-bold text-foreground mb-1">Single Storybook</h3>
              <p className="text-muted-foreground text-sm mb-4">One personalized adventure</p>
              <div className="text-3xl font-bold text-foreground mb-4">
                $7.99
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "1 personalized storybook",
                  "10 illustrated scenes",
                  "HD quality images",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 2-Story Bundle */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 flex flex-col">
              <h3 className="text-lg font-bold text-foreground mb-1">2-Story Bundle</h3>
              <p className="text-muted-foreground text-sm mb-4">Two adventures to enjoy</p>
              <div className="text-3xl font-bold text-foreground mb-1">
                $13.99
              </div>
              <p className="text-secondary text-xs font-medium mb-4">Save $2</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "2 personalized storybooks",
                  "10 scenes each",
                  "Mix & match stories",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 3-Story Bundle */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md">
                  POPULAR
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 mt-2">3-Story Bundle</h3>
              <p className="text-muted-foreground text-sm mb-4">Perfect for bedtime variety</p>
              <div className="text-3xl font-bold text-foreground mb-1">
                $19.99
              </div>
              <p className="text-secondary text-xs font-medium mb-4">Save $4</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "3 personalized storybooks",
                  "10 scenes each",
                  "Ideal for rotation",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button className="w-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* 4-Story Bundle - Best Value */}
            <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/30 p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full shadow-md">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 mt-2">Complete Library</h3>
              <p className="text-muted-foreground text-sm mb-4">All 4 stories at launch</p>
              <div className="text-3xl font-bold text-foreground mb-1">
                $24.99
              </div>
              <p className="text-secondary text-xs font-medium mb-4">Save $7</p>
              <ul className="space-y-2 mb-6 flex-1">
                {[
                  "4 personalized storybooks",
                  "Complete starter collection",
                  "Maximum variety",
                  "Yours forever",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/app" className="block">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg">
                  Get Complete Library
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust message */}
          <div className="text-center mt-10">
            <p className="text-muted-foreground text-sm">
              One-time purchase. No subscription required. Your storybooks are yours to keep forever.
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Make Your Child the Star?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of parents who are creating magical memories with personalized storybooks.
          </p>
          <Link href="/app">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-10 h-14 text-lg"
            >
              Create Your First Story
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border bg-card/70 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/logo-horizontal.svg"
              alt="Twinklebot"
              width={180}
              height={96}
              className="h-10 w-auto"
              style={{ filter: "brightness(1.6) saturate(1.2)" }}
            />

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://www.twinklebot.app/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="https://www.twinklebot.app/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <button onClick={() => setShowContact(true)} className="hover:text-foreground transition-colors">Contact</button>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; 2026 Metabuilder LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal (if needed for direct sign in from marketing page) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={handleSignInWithGoogle}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12"
              >
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-muted text-foreground placeholder:text-muted-foreground"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-muted text-foreground placeholder:text-muted-foreground"
              />

              {isSignUp && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-muted text-foreground placeholder:text-muted-foreground"
                />
              )}

              <Button
                onClick={handleEmailAuth}
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold"
              >
                {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-center text-sm text-primary hover:text-primary/80"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>

              <p className="text-center text-xs text-muted-foreground">
                By using TwinkleBot you agree to the{" "}
                <a href="https://www.twinklebot.app/terms" className="underline hover:text-foreground">Terms of Service</a>
                {" "}and the{" "}
                <a href="https://www.twinklebot.app/privacy" className="underline hover:text-foreground">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Drop us a note at{' '}
              <a
                href="mailto:support@twinklebot.app"
                className="text-primary font-medium hover:underline"
              >
                support@twinklebot.app
              </a>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
