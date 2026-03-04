"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Camera,
  BookOpen,
  Wand2,
} from "lucide-react"

export function WebLandingPage() {
  return (
    <div className="h-screen flex flex-col bg-[#1a1410] overflow-hidden">
      {/* Access App Button - top right */}
      <div className="flex justify-end px-6 py-3 shrink-0">
        <Link href="/app">
          <Button className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold px-6 shadow-lg">
            Access App
          </Button>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="relative flex-1 min-h-0 mx-auto w-full max-w-5xl px-4">
        <div className="relative w-full h-full">
          <Image
            src="/landing-hero.jpg"
            alt="Child experiencing the magic of TwinkleBot storybooks"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Tagline */}
      <div className="shrink-0 text-center py-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white inline-flex items-center gap-3">
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
          Storybooks Where Your Child Is The Hero
          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
        </h1>
      </div>

      {/* Create Magic in 3 Simple Steps */}
      <div className="shrink-0 px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-lg sm:text-xl font-semibold text-amber-100/90 mb-3">
            Create Magic in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {[
              {
                icon: Camera,
                title: "Upload a Photo",
                description: "Take or upload a clear photo of your child.",
                step: 1,
              },
              {
                icon: BookOpen,
                title: "Choose a Story",
                description: "Pick from our library of educational templates.",
                step: 2,
              },
              {
                icon: Wand2,
                title: "Watch the Magic",
                description: "AI generates illustrations with your child as the star.",
                step: 3,
              },
            ].map((step) => (
              <div key={step.step} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 relative">
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                  {step.step}
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-2">
                  <step.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs sm:text-sm text-white/60 leading-snug">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
