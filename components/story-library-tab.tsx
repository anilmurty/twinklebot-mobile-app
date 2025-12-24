"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ImageIcon } from "lucide-react"
import { GenerateStoryDialog } from "@/components/generate-story-dialog"

const storyTemplates = [
  {
    id: 1,
    title: "Counting Adventure",
    description: "Learn to count from 1 to 10 with fun adventures",
    scenes: 10,
    thumbnail: "/counting-numbers-colorful-illustration.jpg",
    category: "Numbers",
    ageRange: "2-5 years",
    coverLabel: "1-10",
  },
  {
    id: 2,
    title: "Alphabet Adventure 1",
    description: "Explore letters A through I with exciting stories",
    scenes: 9,
    thumbnail: "/alphabet-letters-a-to-i-colorful.jpg",
    category: "Letters",
    ageRange: "3-6 years",
    coverLabel: "A-I",
  },
  {
    id: 3,
    title: "Alphabet Adventure 2",
    description: "Discover letters J through R in amazing scenes",
    scenes: 9,
    thumbnail: "/alphabet-letters-j-to-r-educational.jpg",
    category: "Letters",
    ageRange: "3-6 years",
    coverLabel: "J-R",
  },
  {
    id: 4,
    title: "Alphabet Adventure 3",
    description: "Complete the alphabet with letters S through Z",
    scenes: 8,
    thumbnail: "/alphabet-letters-s-to-z-learning.jpg",
    category: "Letters",
    ageRange: "3-6 years",
    coverLabel: "S-Z",
  },
]

export function StoryLibraryTab() {
  const [selectedStory, setSelectedStory] = useState<(typeof storyTemplates)[0] | null>(null)

  return (
    <div className="min-h-full bg-gradient-to-b from-accent/20 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Story Library</h1>
          <p className="text-muted-foreground">Choose a template for your personalized storybook</p>
        </div>

        <div className="grid gap-4">
          {storyTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex gap-4 p-4">
                <div className="relative shrink-0">
                  <img
                    src={template.thumbnail || "/placeholder.svg"}
                    alt={template.title}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {template.coverLabel}
                    </span>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                    {template.category}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-bold text-lg">{template.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {template.scenes} scenes
                    </span>
                    <span>•</span>
                    <span>{template.ageRange}</span>
                  </div>

                  <Button size="sm" className="w-full mt-2" onClick={() => setSelectedStory(template)}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    Generate Story
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary mt-1 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">More stories coming soon!</h4>
              <p className="text-xs text-muted-foreground">
                We're working on new adventures including shapes, colors, and bedtime stories.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {selectedStory && (
        <GenerateStoryDialog
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
          story={selectedStory}
        />
      )}
    </div>
  )
}
