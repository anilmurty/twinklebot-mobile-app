"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Sparkles,
  Camera,
  BookOpen,
  Wand2,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { STORY_CATEGORIES, type StoryCategoryId, getTagline } from "@/lib/story-constants"
import { FeatureShowcase } from "@/components/landing/FeatureShowcase"
import { PricingSection } from "@/components/PricingSection"
import { trackEvent } from "@/lib/utils/analytics"

export function WebLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const heroImages = ["/hero-1.jpg", "/hero-2.jpg", "/hero-3.jpg"]

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  const handleCta = (location: string) => {
    trackEvent("cta_click", { location, label: "Get Started" })
    window.location.href = "/app"
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const assetUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/render/image/public/story-template-assets/${path}?quality=60`

  // All stories grouped by category (matching shared STORY_CATEGORIES)
  const storiesByCategory: Record<StoryCategoryId, { title: string; description: string; image: string; age: string; scenes: number }[]> = {
    language: [
      { title: "Alphabet Adventures A-I", description: "Explore letters A to I", image: assetUrl("alphabet-general/alphabet-general-a-through-i.png"), age: "2-6", scenes: 9 },
      { title: "Alphabet Adventures J-R", description: "Explore letters J to R", image: assetUrl("alphabet-general/alphabet-general-j-through-r.png"), age: "2-6", scenes: 9 },
      { title: "Alphabet Adventures S-Z", description: "Explore letters S to Z", image: assetUrl("alphabet-general/alphabet-general-s-through-z.png"), age: "2-6", scenes: 8 },
      { title: "Colors of the Carnival", description: "A colorful celebration", image: assetUrl("colors-of-the-carnival/colors-of-the-carnival.png"), age: "2-6", scenes: 10 },
      { title: "Opposites at the Playground", description: "Learn big and small", image: assetUrl("opposites-at-the-playground/opposites-at-the-playground.png"), age: "2-6", scenes: 10 },
      { title: "The Feelings Farm", description: "Understand your emotions", image: assetUrl("the-feelings-farm/the-feelings-farm.png"), age: "2-6", scenes: 10 },
      { title: "A Day in My Body", description: "Explore how your body works", image: assetUrl("a-day-in-my-body/a-day-in-my-body.png"), age: "2-6", scenes: 10 },
      { title: "Vehicles on the Go", description: "Cars, trucks, and more", image: assetUrl("vehicles-on-the-go/vehicles-on-the-go.png"), age: "2-6", scenes: 10 },
      { title: "Animals Around the World", description: "Meet animals everywhere", image: assetUrl("animals-around-the-world/animals-around-the-world.png"), age: "2-6", scenes: 10 },
      { title: "Action Heroes", description: "Be a real-life hero", image: assetUrl("action-heroes/action-heroes.png"), age: "2-6", scenes: 10 },
      { title: "My Five Senses Adventure", description: "See, hear, touch, taste, smell", image: assetUrl("my-five-senses-adventure/my-five-senses-adventure.png"), age: "2-6", scenes: 10 },
      { title: "Weather Words", description: "Learn weather vocabulary", image: assetUrl("weather-words/weather-words.png"), age: "2-6", scenes: 10 },
    ],
    math: [
      { title: "Counting Adventures", description: "Learn numbers 1-10 with fun", image: assetUrl("counting-general/counting-general.png"), age: "1-5", scenes: 10 },
      { title: "The Great Bake Sale", description: "Bake and share treats", image: assetUrl("the-great-bake-sale/the-great-bake-sale.png"), age: "2-6", scenes: 10 },
      { title: "Building a Birdhouse", description: "Create a home for birds", image: assetUrl("building-a-birdhouse/building-a-birdhouse.png"), age: "2-6", scenes: 10 },
      { title: "Camping Under the Stars", description: "A nighttime adventure", image: assetUrl("camping-under-the-stars/camping-under-the-stars.png"), age: "2-6", scenes: 10 },
      { title: "The Toy Store Sort", description: "Organize the toy store", image: assetUrl("the-toy-store-sort/the-toy-store-sort.png"), age: "2-6", scenes: 10 },
      { title: "Race Day at the Track", description: "Ready, set, go!", image: assetUrl("race-day-at-the-track/race-day-at-the-track.png"), age: "2-6", scenes: 10 },
      { title: "The Garden Grows", description: "Watch a garden bloom", image: assetUrl("the-garden-grows/the-garden-grows.png"), age: "2-6", scenes: 10 },
      { title: "The Pizza Party Problem", description: "Solve a cheesy puzzle", image: assetUrl("the-pizza-party-problem/the-pizza-party-problem.png"), age: "2-6", scenes: 10 },
      { title: "The Aquarium Helper", description: "Care for sea creatures", image: assetUrl("the-acquarium-helper/the-acquarium-helper.png"), age: "2-6", scenes: 10 },
      { title: "The Big Shape City", description: "Shapes are everywhere", image: assetUrl("the-big-shape-city/the-big-shape-city.png"), age: "2-6", scenes: 10 },
      { title: "Visit to the Farmers Market", description: "Discover fresh foods", image: assetUrl("visit-to-the-farmers-market/visit-to-the-farmers-market.png"), age: "2-6", scenes: 10 },
    ],
    world: [
      { title: "A Day at the Zoo", description: "An adventure with friendly animals", image: assetUrl("day-at-the-zoo/day-at-the-zoo.png"), age: "1-5", scenes: 10 },
      { title: "Field Trip to the Fire Station", description: "Learn about firefighters", image: assetUrl("field-trip-to-the-fire-station/field-trip-to-the-fire-station.png"), age: "2-6", scenes: 10 },
      { title: "From Seed to Supermarket", description: "How food reaches you", image: assetUrl("from-seed-to-supermarket/from-seed-to-supermarket.png"), age: "2-6", scenes: 10 },
      { title: "Under the Ocean", description: "Dive into the deep blue", image: assetUrl("under-the-ocean/under-the-ocean.png"), age: "2-6", scenes: 10 },
      { title: "Into the Rainforest", description: "Explore the jungle", image: assetUrl("into-the-rainforest/into-the-rainforest.png"), age: "2-6", scenes: 10 },
      { title: "The Construction Site", description: "Build something amazing", image: assetUrl("the-construction-site/the-construction-site.png"), age: "2-6", scenes: 10 },
      { title: "Around the World in 10 Meals", description: "Taste global cuisines", image: assetUrl("around-the-world-in-10-meals/around-the-world-in-10-meals.png"), age: "2-6", scenes: 10 },
      { title: "The Weather Station", description: "Predict the weather", image: assetUrl("the-weather-station/the-weather-station.png"), age: "2-6", scenes: 10 },
      { title: "Night Sky Explorer", description: "Discover stars and planets", image: assetUrl("night-sky-explorer/night-sky-explorer.png"), age: "2-6", scenes: 10 },
      { title: "The Hospital Helper", description: "Learn about doctors", image: assetUrl("the-hospital-helper/the-hospital-helper.png"), age: "2-6", scenes: 10 },
      { title: "The River's Journey", description: "Follow a river to the sea", image: assetUrl("the-rivers-journey/the-rivers-journey.png"), age: "2-6", scenes: 10 },
    ],
    science: [
      { title: "How a Volcano Works", description: "Explore erupting volcanoes", image: assetUrl("how-a-volcano-works/how-a-volcano-works.png"), age: "2-6", scenes: 10 },
      { title: "Inside the Human Body", description: "Journey through organs", image: assetUrl("inside-the-human-body/inside-the-human-body.png"), age: "2-6", scenes: 10 },
      { title: "The Life of a Butterfly", description: "Watch a metamorphosis", image: assetUrl("the-life-of-a-butterfly/the-life-of-a-butterfly.png"), age: "2-6", scenes: 10 },
      { title: "Where Does Water Go?", description: "Follow the water cycle", image: assetUrl("where-does-water-go/where-does-water-go.png"), age: "2-6", scenes: 10 },
      { title: "The Earthquake Investigator", description: "Discover what shakes the earth", image: assetUrl("the-earthquake-investigator/the-earthquake-investigator.png"), age: "2-6", scenes: 10 },
      { title: "Light and Shadows", description: "Play with light", image: assetUrl("light-and-shadows/light-and-shadows.png"), age: "2-6", scenes: 10 },
      { title: "The Magnetic World", description: "Discover magnets", image: assetUrl("the-magnetic-world/the-magnetic-world.png"), age: "2-6", scenes: 10 },
      { title: "A Day in the Life of a Seed", description: "Watch a seed grow", image: assetUrl("a-day-in-the-life-of-a-seed/a-day-in-the-life-of-a-seed.png"), age: "2-6", scenes: 10 },
      { title: "Forces All Around Us", description: "Discover push and pull", image: assetUrl("forces-all-around-us/forces-all-around-us.png"), age: "2-6", scenes: 10 },
      { title: "The Deep Freeze", description: "Explore icy worlds", image: assetUrl("the-deep-freeze/the-deep-freeze.png"), age: "2-6", scenes: 10 },
    ],
    scifi: [
      { title: "Mission To The Moon", description: "A space adventure", image: assetUrl("mission-to-the-moon/mission-to-the-moon.png"), age: "2-6", scenes: 10 },
      { title: "The Time Traveler's Backpack", description: "Journey through time", image: assetUrl("the-time-travelers-backpack/the-time-travelers-backpack.png"), age: "2-6", scenes: 10 },
      { title: "Planet of the Colors", description: "A colorful space trip", image: assetUrl("planet-of-the-colors/planet-of-the-colors.png"), age: "2-6", scenes: 10 },
      { title: "The Dream Architect", description: "Design your dreams", image: assetUrl("the-dream-architect/the-dream-architect.png"), age: "2-6", scenes: 10 },
      { title: "The Robot Best Friend", description: "Meet your robot pal", image: assetUrl("the-robot-best-friend/the-robot-best-friend.png"), age: "2-6", scenes: 10 },
      { title: "Guardians of the Forest", description: "Protect the woodland", image: assetUrl("guardians-of-the-forest/guardians-of-the-forest.png"), age: "2-6", scenes: 10 },
      { title: "The Cloud Castle", description: "Adventure in the clouds", image: assetUrl("the-cloud-castle/the-cloud-castle.png"), age: "2-6", scenes: 10 },
      { title: "The Smallest Astronaut", description: "A tiny space explorer", image: assetUrl("the-smallest-astronaut/the-smallest-astronaut.png"), age: "2-6", scenes: 10 },
      { title: "The Portal Map", description: "Travel through portals", image: assetUrl("the-portal-map/the-portal-map.png"), age: "2-6", scenes: 10 },
      { title: "The Star Catcher", description: "Catch falling stars", image: assetUrl("the-star-catcher/the-star-catcher.png"), age: "2-6", scenes: 10 },
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
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </a>
              <a href="#stories" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Stories
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pricing
              </a>
            </nav>

            {/* CTA button */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={() => handleCta("header")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-6"
              >
                Get Started Free
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
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
              <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                Features
              </a>
              <a href="#stories" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                Stories
              </a>
              <a href="#pricing" className="block py-2 text-muted-foreground hover:text-foreground font-medium">
                Pricing
              </a>
              <div className="pt-3 border-t border-border space-y-2">
                <Button
                  onClick={() => { setMobileMenuOpen(false); handleCta("mobile_menu") }}
                  className="w-full bg-primary text-primary-foreground font-semibold"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
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
              sizes="100vw"
              className={`object-cover object-center transition-opacity duration-1000 ${i === heroIndex ? "opacity-100" : "opacity-0"}`}
              priority={i === 0}
              {...(i === 0 ? { fetchPriority: "high" as const } : {})}
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
                    Your Child Is The Hero
                  </span>
                </h1>

                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={() => handleCta("hero_desktop")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                  >
                    Get Started Free
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                  <a href="#how-it-works" onClick={() => trackEvent("cta_click", { location: "hero_desktop", label: "See How It Works" })}>
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
                  <Sparkles className="w-5 h-5 text-primary" />
                  <p className="text-sm text-white/60">First personalized story free &mdash; no credit card needed</p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Mobile: stacked layout — image on top, text below */}
        <div className="lg:hidden">
          {/* Hero image on top — crossfade carousel with store buttons */}
          <div className="relative w-full aspect-[16/9]">
            {heroImages.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt="Parent and child experiencing TwinkleBot storybooks"
                fill
                sizes="100vw"
                className={`object-cover object-right transition-opacity duration-1000 ${i === heroIndex ? "opacity-100" : "opacity-0"}`}
                priority={i === 0}
                {...(i === 0 ? { fetchPriority: "high" as const } : {})}
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
              <Button
                size="lg"
                onClick={() => handleCta("hero_mobile")}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <a href="#how-it-works" onClick={() => trackEvent("cta_click", { location: "hero_mobile", label: "See How It Works" })}>
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
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">First personalized story free &mdash; no credit card needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Templates Showcase */}
      <section id="stories" className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Educational Stories Kids Love
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each story is designed to entertain while teaching valuable lessons.
            </p>
          </div>

          {/* Carousel keyframes */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes scroll-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            .carousel-row:hover .carousel-strip {
              animation-play-state: paused !important;
            }
          `}} />

          <div className="space-y-10">
            {STORY_CATEGORIES.map((cat, catIndex) => {
              const stories = storiesByCategory[cat.id]
              if (!stories || stories.length === 0) return null
              const direction = catIndex % 2 === 0 ? "scroll-left" : "scroll-right"
              const duration = `${Math.max(40, stories.length * 5)}s`
              return (
                <div key={cat.id}>
                  <h3 className="text-sm sm:text-base font-normal uppercase tracking-widest text-primary mb-4 pl-2">
                    {cat.label}
                  </h3>
                  <div className="relative overflow-hidden carousel-row">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-24 z-10 bg-gradient-to-r from-card/80 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-24 z-10 bg-gradient-to-l from-card/80 to-transparent" />
                    <div
                      className="flex gap-6 w-max carousel-strip"
                      style={{ animation: `${direction} ${duration} linear infinite` }}
                    >
                      {[...stories, ...stories].map((story, i) => {
                        const tagline = getTagline(story.title)
                        return (
                          <div
                            key={i}
                            className="group/card relative rounded-3xl overflow-hidden shadow-lg border border-border/50 flex-shrink-0 w-[280px] sm:w-[320px] cursor-pointer"
                          >
                            <div className="aspect-[4/3] relative">
                              <Image
                                src={story.image}
                                alt={story.title}
                                fill
                                className="object-cover transition-transform group-hover/card:scale-105"
                              />
                              {/* Always-visible gradient + title */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {/* Stronger gradient on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                            </div>
                            {/* Always visible: just title */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white group-hover/card:opacity-0 transition-opacity duration-300">
                              <h3 className="text-lg font-bold text-white truncate">{story.title}</h3>
                            </div>
                            {/* Hover: full details */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-y-2 group-hover/card:translate-y-0">
                              <h3 className="text-lg font-bold text-white mb-1">{story.title}</h3>
                              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">{tagline.verb} {tagline.subject}</p>
                              <p className="text-white/80 text-sm mb-2">{story.description}</p>
                              <p className="text-white/60 text-xs">Ages {story.age} · {story.scenes} pages</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => handleCta("stories_section")}
              className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-8"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <FeatureShowcase />

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

          {/* Read-only mode callout */}
          <div className="mt-8 lg:mt-12 flex items-center gap-4 rounded-3xl border border-border/50 bg-card px-8 py-6">
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div>
              <p className="text-foreground font-semibold text-lg leading-snug">
                Don&apos;t want to upload a photo? No problem!
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Browse <span className="text-primary font-semibold text-base">50+ free stories</span> with no upload, no payment, and no personal
                information required — just create a free account and start reading
                with your child today.
              </p>
              <a
                href="/app"
                onClick={() => trackEvent("cta_click", { location: "how_it_works_callout", label: "Get Started" })}
                className="mt-3 inline-block text-primary font-semibold text-sm hover:underline"
              >
                Get Started Free →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection onEarlyAccess={() => handleCta("pricing")} />

      {/* Final CTA */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Make Your Child the Star?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create a personalized storybook where your child is the hero — it only takes a few minutes.
          </p>
          <Button
            size="lg"
            onClick={() => handleCta("final_cta")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl shadow-primary/30 px-10 h-14 text-lg"
          >
            Get Started Free
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      </main>

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

            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/people/Twinklebot/61572058569976/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/twinklebotapp/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@twinklebotapp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; 2026 Metabuilder LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-[min(28rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto">
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
