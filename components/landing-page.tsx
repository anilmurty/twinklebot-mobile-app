"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Sparkles, Users, Library } from "lucide-react"

export function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-secondary/10 to-accent/10 flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8 max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-4 pt-8">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Twinklebot</h1>
            </div>
            <p className="text-xl text-muted-foreground text-balance">
              Transform your child into the hero of their own personalized storybook
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <img
              src="/happy-children-reading-colorful-storybooks-togethe.jpg"
              alt="Children enjoying storybooks"
              className="w-full h-64 object-cover rounded-2xl shadow-xl"
            />
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">How It Works</h2>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Create Characters</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your child's photo and create a character that looks just like them
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Library className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Choose a Story</h3>
                  <p className="text-sm text-muted-foreground">
                    Pick from educational templates: counting adventures or alphabet journeys
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex gap-4 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Generate & Enjoy</h3>
                  <p className="text-sm text-muted-foreground">
                    AI creates a unique storybook featuring your child as the main character
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Story Types */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Educational Stories</h2>
            <div className="grid gap-3">
              <Card className="p-3 bg-primary/5">
                <h4 className="font-semibold">📚 Counting Adventure (1-10)</h4>
                <p className="text-xs text-muted-foreground">Learn numbers through exciting adventures</p>
              </Card>
              <Card className="p-3 bg-secondary/5">
                <h4 className="font-semibold">🔤 Alphabet Adventures (A-Z)</h4>
                <p className="text-xs text-muted-foreground">Explore letters in three engaging story parts</p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 bg-background/80 backdrop-blur-sm border-t space-y-3">
        <Button onClick={onLogin} className="w-full h-12 text-lg font-semibold">
          Get Started
        </Button>
        <Button onClick={onLogin} variant="outline" className="w-full bg-transparent">
          Already have an account? Log In
        </Button>
      </div>
    </div>
  )
}
