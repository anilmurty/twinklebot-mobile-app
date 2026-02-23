"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ImageIcon, Loader2, Lightbulb, Eye } from "lucide-react"
import { GenerateStoryDialog } from "@/components/generate-story-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useTemplates } from "@/lib/queries"

interface Template {
  id: number
  title: string
  description: string
  thumbnail_url?: string
  script_data?: any[]
  mock_story_data?: {
    scenes?: any[]
    character_name?: string
  }
}

export function StoryLibraryTab() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Use TanStack Query for data fetching with automatic caching
  // Templates are cached for 30 minutes since they rarely change
  const { 
    data: templatesData, 
    isLoading: loading, 
    error: templatesError 
  } = useTemplates()
  
  // Derive data from query results
  const templates = templatesData?.templates || []
  const error = templatesError?.message || null
  
  const [selectedStory, setSelectedStory] = useState<Template | null>(null)
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(new Set())
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  
  // Check for templateId in URL params to auto-open generate modal (from preview page)
  useEffect(() => {
    const templateId = searchParams.get('templateId')
    if (templateId && templates.length > 0 && !selectedStory) {
      const template = templates.find(t => t.id === parseInt(templateId))
      if (template) {
        setSelectedStory(template)
        // Clear the URL param after opening the modal
        router.replace('/app?tab=library', { scroll: false })
      }
    }
  }, [searchParams, templates, selectedStory, router])

  const getCoverLabel = (title: string) => {
    if (title.includes("Counting")) return "1-10"
    if (title.includes("Alphabet Adventure 1")) return "A-I"
    if (title.includes("Alphabet Adventure 2")) return "J-R"
    if (title.includes("Alphabet Adventure 3")) return "S-Z"
    return ""
  }

  const getCategory = (title: string) => {
    if (title.includes("Counting")) return "Numbers"
    if (title.includes("Alphabet")) return "Letters"
    return "Story"
  }

  const getSceneCount = (template: Template) => {
    // script_data is a JSONB object with a scenes array inside it
    if (template.script_data && typeof template.script_data === "object" && "scenes" in template.script_data) {
      return Array.isArray(template.script_data.scenes) ? template.script_data.scenes.length : 0
    }
    // Fallback: check if script_data is directly an array (legacy format)
    if (Array.isArray(template.script_data)) {
      return template.script_data.length
    }
    return 0
  }

  const handleThumbnailError = useCallback((templateId: number, thumbnail: string, title: string) => {
    setFailedThumbnails((prev) => {
      const newSet = new Set(prev)
      newSet.add(templateId)
      return newSet
    })
  }, [])

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return

    setSubmittingFeedback(true)
    try {
      // Here you would send the feedback to your backend
      console.log("Feedback submitted:", feedbackText)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setFeedbackText("")
      setShowFeedbackDialog(false)
    } catch (err) {
      console.error("Failed to submit feedback:", err)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-accent/20 to-background">
      <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Story Library</h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            Choose a template for your personalized storybook
          </p>
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
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {templates.map((template) => {
              const coverLabel = getCoverLabel(template.title)
              const category = getCategory(template.title)
              const sceneCount = getSceneCount(template)
              const thumbnail = template.thumbnail_url

              return (
                <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow w-full flex flex-col h-full">
                  <div className="flex flex-col gap-3 p-4 md:p-6 w-full flex-1">
                    <div className="relative shrink-0 mx-auto">
                      {thumbnail && !failedThumbnails.has(template.id) ? (
                        <img
                          src={thumbnail || "/placeholder.svg"}
                          alt={template.title}
                          className="w-32 h-44 md:w-40 md:h-56 object-cover rounded-lg"
                          onError={() => handleThumbnailError(template.id, thumbnail, template.title)}
                        />
                      ) : (
                        <div className="w-32 h-44 md:w-40 md:h-56 bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      {coverLabel && thumbnail && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {coverLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col space-y-2 w-full min-h-0">
                      <div className="flex-shrink-0">
                        <h3 className="font-bold text-lg md:text-xl text-center break-words leading-tight">{template.title}</h3>
                        <p className="text-sm md:text-base text-muted-foreground text-center break-words line-clamp-3 mt-1 min-h-[3rem]">
                          {template.description?.replace(/\{character_name\}/g, "your child") ||
                            "A personalized adventure story"}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {sceneCount} scenes
                        </span>
                      </div>

                      <div className="flex gap-2 mt-auto pt-2 flex-shrink-0">
                        {template.mock_story_data?.scenes && Array.isArray(template.mock_story_data.scenes) && template.mock_story_data.scenes.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1" 
                            onClick={() => window.location.href = `/preview/${template.id}`}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          className={template.mock_story_data?.scenes && Array.isArray(template.mock_story_data.scenes) && template.mock_story_data.scenes.length > 0 ? "flex-1" : "w-full"} 
                          onClick={() => setSelectedStory(template)}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="p-4 md:p-6 bg-muted/50">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              <h4 className="font-semibold text-sm md:text-base">More stories coming soon!</h4>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Stay tuned as we add many more adventures and educational stories.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
              className="w-full md:w-auto"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Submit a story idea
            </Button>
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

      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Story Idea</DialogTitle>
            <DialogDescription>Tell us what kind of story you'd like to see in Twinklebot!</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Share your story idea here..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)} disabled={submittingFeedback}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={!feedbackText.trim() || submittingFeedback}>
              {submittingFeedback ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
