"use client"

import { BookOpen, Clock, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const mockStorybooks = [
  {
    id: 1,
    title: "Counting Adventure",
    character: "Emma",
    status: "completed",
    thumbnail: "/colorful-counting-storybook-cover.jpg",
    createdAt: "2 days ago",
    scenes: 10,
  },
  {
    id: 2,
    title: "Alphabet Adventure 1",
    character: "Liam",
    status: "generating",
    thumbnail: "/alphabet-learning-book-cover.jpg",
    createdAt: "1 hour ago",
    scenes: 9,
    progress: 60,
  },
  {
    id: 3,
    title: "Alphabet Adventure 2",
    character: "Emma",
    status: "completed",
    thumbnail: "/educational-alphabet-book.jpg",
    createdAt: "1 week ago",
    scenes: 9,
  },
]

export function StorybooksTab() {
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">My Storybooks</h1>
          <p className="text-muted-foreground">Your personalized adventure library</p>
        </div>

        {mockStorybooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-secondary-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No storybooks yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create a character and generate your first personalized storybook!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {mockStorybooks.map((storybook) => (
              <Card key={storybook.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex gap-4 p-4">
                  <div className="relative shrink-0">
                    <img
                      src={storybook.thumbnail || "/placeholder.svg"}
                      alt={storybook.title}
                      className="w-24 h-32 object-cover rounded-lg"
                    />
                    {storybook.status === "generating" && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{storybook.title}</h3>
                      <p className="text-sm text-muted-foreground">Starring: {storybook.character}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{storybook.scenes} scenes</span>
                      <span>•</span>
                      <span>{storybook.createdAt}</span>
                    </div>

                    {storybook.status === "completed" ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                        <Button size="sm" className="ml-auto">
                          Read Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Generating...</span>
                          <span className="font-medium">{storybook.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${storybook.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
