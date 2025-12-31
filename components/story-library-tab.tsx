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
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(new Set())

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await templatesApi.list()
        const templatesList = data.templates || []
        console.log('Fetched templates:', templatesList.map((t: Template) => ({
          id: t.id,
          title: t.title,
          thumbnail_url: t.thumbnail_url
        })))
        setTemplates(templatesList)
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
    // script_data is a JSONB object with a scenes array inside it
    if (template.script_data && typeof template.script_data === 'object' && 'scenes' in template.script_data) {
      return Array.isArray(template.script_data.scenes) ? template.script_data.scenes.length : 0
    }
    // Fallback: check if script_data is directly an array (legacy format)
    if (Array.isArray(template.script_data)) {
      return template.script_data.length
    }
    return 0
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-accent/20 to-background">
      <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Story Library</h1>
          <p className="text-muted-foreground text-base md:text-lg">Choose a template for your personalized storybook</p>
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
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const coverLabel = getCoverLabel(template.title)
              const category = getCategory(template.title)
              const sceneCount = getSceneCount(template)
              const thumbnail = template.thumbnail_url

              return (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 md:gap-6 p-4 md:p-6 flex-col md:flex-row">
                    <div className="relative shrink-0">
                      {thumbnail && !failedThumbnails.has(template.id) ? (
                        <img
                          src={thumbnail}
                          alt={template.title}
                          className="w-24 h-32 md:w-32 md:h-44 lg:w-40 lg:h-56 object-cover rounded-lg"
                          onError={() => {
                            // Mark this thumbnail as failed
                            console.error(`Failed to load thumbnail for ${template.title}:`, thumbnail)
                            setFailedThumbnails(prev => new Set(prev).add(template.id))
                          }}
                        />
                      ) : (
                        <div className="w-24 h-32 md:w-32 md:h-44 lg:w-40 lg:h-56 bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
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

                    <div className="flex-1 space-y-2 md:space-y-3">
                      <div>
                        <h3 className="font-bold text-lg md:text-xl lg:text-2xl">{template.title}</h3>
                        <p className="text-sm md:text-base text-muted-foreground line-clamp-2">
                          {template.description?.replace(/\{character_name\}/g, 'your child') || 'A personalized adventure story'}
                        </p>
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
