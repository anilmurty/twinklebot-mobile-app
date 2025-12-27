"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ImageIcon, Loader2 } from "lucide-react"
import { GenerateStoryDialog } from "@/components/generate-story-dialog"
import { templatesApi } from "@/lib/api-client"

interface Template {
  id: number
  title: string
  description: string
  thumbnail_url?: string
  script_data?: any[]
}

export function StoryLibraryTab() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStory, setSelectedStory] = useState<Template | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await templatesApi.list()
        setTemplates(data.templates || [])
      } catch (err: any) {
        console.error('Failed to fetch templates:', err)
        setError(err.message || 'Failed to load story templates')
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const getCoverLabel = (title: string) => {
    if (title.includes('Counting')) return '1-10'
    if (title.includes('Alphabet Adventure 1')) return 'A-I'
    if (title.includes('Alphabet Adventure 2')) return 'J-R'
    if (title.includes('Alphabet Adventure 3')) return 'S-Z'
    return ''
  }

  const getCategory = (title: string) => {
    if (title.includes('Counting')) return 'Numbers'
    if (title.includes('Alphabet')) return 'Letters'
    return 'Story'
  }

  const getSceneCount = (template: Template) => {
    return template.script_data?.length || 0
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-accent/20 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Story Library</h1>
          <p className="text-muted-foreground">Choose a template for your personalized storybook</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => {
              const coverLabel = getCoverLabel(template.title)
              const category = getCategory(template.title)
              const sceneCount = getSceneCount(template)
              const thumbnail = template.thumbnail_url

              return (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 p-4">
                    <div className="relative shrink-0">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={template.title}
                          className="w-24 h-32 object-cover rounded-lg"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="w-24 h-32 bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {coverLabel && thumbnail && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {coverLabel}
                          </span>
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
                        {category}
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
                          {sceneCount} scenes
                        </span>
                      </div>

                      <Button size="sm" className="w-full mt-2" onClick={() => setSelectedStory(template)}>
                        <BookOpen className="w-3 h-3 mr-1" />
                        Generate Story
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

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
