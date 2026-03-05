"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookOpen, Loader2, Lightbulb, Eye, Sparkles } from "lucide-react"
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

// --- Category definitions ---

const CATEGORIES = [
  { id: "math", label: "Math Learning" },
  { id: "language", label: "Language Learning" },
  { id: "world", label: "World Knowledge" },
] as const

function getDisplayCategory(title: string): string {
  if (title.includes("Count")) return "math"
  if (title.includes("Alphabet")) return "language"
  if (title.includes("Zoo")) return "world"
  return "world"
}

function getTagline(title: string): { verb: string; subject: string; color: string } {
  if (title.includes("Counting"))
    return { verb: "TEACHES", subject: "COUNTING 1-10", color: "text-blue-400" }
  if (title.includes("Alphabet Adventure 1") || title.includes("Alphabet") && title.includes("A"))
    return { verb: "TEACHES", subject: "LETTERS A-I", color: "text-green-400" }
  if (title.includes("Alphabet Adventure 2") || title.includes("Alphabet") && title.includes("J"))
    return { verb: "TEACHES", subject: "LETTERS J-R", color: "text-green-400" }
  if (title.includes("Alphabet Adventure 3") || title.includes("Alphabet") && title.includes("S"))
    return { verb: "TEACHES", subject: "LETTERS S-Z", color: "text-green-400" }
  if (title.includes("Zoo"))
    return { verb: "EXPLORES", subject: "ANIMALS & NATURE", color: "text-amber-400" }
  return { verb: "EXPLORES", subject: "ADVENTURE", color: "text-amber-400" }
}

// --- LibraryCard component ---

function LibraryCard({
  template,
  failedThumbnails,
  onThumbnailError,
  onPreview,
  onGenerate,
}: {
  template: Template
  failedThumbnails: Set<number>
  onThumbnailError: (id: number) => void
  onPreview: (template: Template) => void
  onGenerate: (template: Template) => void
}) {
  const thumbnail = template.thumbnail_url
  const hasMock =
    template.mock_story_data?.scenes &&
    Array.isArray(template.mock_story_data.scenes) &&
    template.mock_story_data.scenes.length > 0
  const tagline = getTagline(template.title)

  return (
    <div className="flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-[280px] lg:w-[260px] snap-start group">
      {/* Image area */}
      <div
        className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => (hasMock ? onPreview(template) : onGenerate(template))}
      >
        {thumbnail && !failedThumbnails.has(template.id) ? (
          <img
            src={thumbnail}
            alt={template.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => onThumbnailError(template.id)}
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/30" />
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Desktop hover overlay */}
        <div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center gap-2">
          {hasMock && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview(template)
              }}
              className="px-4 py-2 rounded-full bg-white/90 text-gray-900 text-sm font-semibold hover:bg-white transition-colors"
            >
              Preview
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGenerate(template)
            }}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Title + tagline below image */}
      <div className="mt-2.5 px-1">
        <h3 className="font-semibold text-base leading-tight truncate text-foreground">
          {template.title}
        </h3>
        <p className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase">
          <span className="text-muted-foreground">{tagline.verb}</span>
          <span className={tagline.color}> · {tagline.subject}</span>
        </p>
      </div>

      {/* Mobile buttons below tagline */}
      <div className="flex gap-2 mt-2 px-1 md:hidden">
        {hasMock && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-white/20 text-white/80 hover:bg-white/10"
            onClick={() => onPreview(template)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
        )}
        <Button
          size="sm"
          className={`${hasMock ? "flex-1" : "w-full"} h-8 text-xs`}
          onClick={() => onGenerate(template)}
        >
          <BookOpen className="w-3 h-3 mr-1" />
          Generate
        </Button>
      </div>
    </div>
  )
}

// --- CategorySection component ---

function CategorySection({
  label,
  templates,
  failedThumbnails,
  onThumbnailError,
  onPreview,
  onGenerate,
}: {
  label: string
  templates: Template[]
  failedThumbnails: Set<number>
  onThumbnailError: (id: number) => void
  onPreview: (template: Template) => void
  onGenerate: (template: Template) => void
}) {
  if (templates.length === 0) return null

  return (
    <section className="space-y-3">
      <h2
        className="font-bold text-2xl md:text-3xl px-1 text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
        {templates.map((template) => (
          <LibraryCard
            key={template.id}
            template={template}
            failedThumbnails={failedThumbnails}
            onThumbnailError={onThumbnailError}
            onPreview={onPreview}
            onGenerate={onGenerate}
          />
        ))}
      </div>
    </section>
  )
}

// --- Main component ---

export function StoryLibraryTab() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    data: templatesData,
    isLoading: loading,
    error: templatesError,
  } = useTemplates()

  const templates = templatesData?.templates || []
  const error = templatesError?.message || null

  const [selectedStory, setSelectedStory] = useState<Template | null>(null)
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(new Set())
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  // Check for templateId in URL params to auto-open generate modal (from preview page)
  useEffect(() => {
    const templateId = searchParams.get("templateId")
    if (templateId && templates.length > 0 && !selectedStory) {
      const template = templates.find((t) => t.id === parseInt(templateId))
      if (template) {
        setSelectedStory(template)
        router.replace("/app?tab=library", { scroll: false })
      }
    }
  }, [searchParams, templates, selectedStory, router])

  // Auto-open template picker when navigated with create=true (from storybooks tab FAB)
  useEffect(() => {
    const shouldCreate = searchParams.get("create")
    if (shouldCreate === "true" && templates.length > 0) {
      setShowTemplatePicker(true)
      router.replace("/app?tab=library", { scroll: false })
    }
  }, [searchParams, templates, router])

  const handleThumbnailError = useCallback((templateId: number) => {
    setFailedThumbnails((prev) => {
      const newSet = new Set(prev)
      newSet.add(templateId)
      return newSet
    })
  }, [])

  const handlePreview = useCallback(
    (template: Template) => {
      router.push(`/preview/${template.id}`)
    },
    [router]
  )

  const handleGenerate = useCallback((template: Template) => {
    setSelectedStory(template)
  }, [])

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return

    setSubmittingFeedback(true)
    try {
      console.log("Feedback submitted:", feedbackText)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setFeedbackText("")
      setShowFeedbackDialog(false)
    } catch (err) {
      console.error("Failed to submit feedback:", err)
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Group templates by category
  const categorizedTemplates = CATEGORIES.map((cat) => ({
    ...cat,
    templates: templates.filter((t) => getDisplayCategory(t.title) === cat.id),
  }))

  return (
    <div className="min-h-full">
      <div className="p-6 md:p-8 lg:p-10 pb-24 space-y-8 md:space-y-10">
        {/* Desktop heading */}
        <h1
          className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Story Library
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : (
          <>
            {/* Category sections */}
            {categorizedTemplates.map((cat) => (
              <CategorySection
                key={cat.id}
                label={cat.label}
                templates={cat.templates}
                failedThumbnails={failedThumbnails}
                onThumbnailError={handleThumbnailError}
                onPreview={handlePreview}
                onGenerate={handleGenerate}
              />
            ))}

            {/* All Stories section */}
            <section className="space-y-3">
              <h2
                className="font-bold text-2xl md:text-3xl px-1 text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                All Stories
              </h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
                {templates.map((template) => (
                  <LibraryCard
                    key={template.id}
                    template={template}
                    failedThumbnails={failedThumbnails}
                    onThumbnailError={handleThumbnailError}
                    onPreview={handlePreview}
                    onGenerate={handleGenerate}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* More stories coming soon — width matches card row */}
        <div className="rounded-2xl bg-card border border-border p-5 md:p-6 w-[70vw] sm:w-[calc(2*45vw+1rem)] md:w-[calc(3*280px+2*1rem)] lg:w-[calc(3*260px+2*1rem)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary shrink-0" />
                <h4 className="font-semibold text-sm md:text-base text-foreground">
                  More stories coming soon!
                </h4>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Stay tuned as we add many more adventures and educational stories.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowFeedbackDialog(true)}
              className="shrink-0 w-full sm:w-auto"
              variant="outline"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Submit a story idea
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {templates.length > 0 && (
        <div
          className="fixed left-4 right-4 z-20 flex justify-center"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <Button
            onClick={() => setShowTemplatePicker(true)}
            className="h-auto py-2.5 px-5 flex items-center justify-center gap-2 rounded-full shadow-lg border-0 bg-primary text-primary-foreground"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Create New Storybook</span>
          </Button>
        </div>
      )}

      {/* Template Picker Dialog */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="max-w-sm max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              <span className="text-primary">Choose</span> a Story
            </DialogTitle>
            <DialogDescription>Pick a template to create a personalized storybook</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4 overflow-y-auto max-h-[50vh]">
            {templates.map((template) => {
              const tagline = getTagline(template.title)
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setShowTemplatePicker(false)
                    setSelectedStory(template)
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left w-full group"
                >
                  {template.thumbnail_url && !failedThumbnails.has(template.id) ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.title}
                      className="w-14 h-[4.5rem] object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-[4.5rem] bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {template.title}
                    </h4>
                    <p className="text-[11px] font-semibold tracking-wider uppercase mt-0.5">
                      <span className="text-muted-foreground">{tagline.verb}</span>
                      <span className={tagline.color}> · {tagline.subject}</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {template.description?.replace(/\{character_name\}/g, "your child") ||
                        "A personalized adventure"}
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 text-primary/0 group-hover:text-primary transition-colors shrink-0" />
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="text-xl">
              <Lightbulb className="w-5 h-5 text-primary inline mr-2" />
              Submit a <span className="text-primary">Story Idea</span>
            </DialogTitle>
            <DialogDescription>
              What kind of adventure should we create next? We&apos;d love to hear your ideas!
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
              disabled={submittingFeedback}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={!feedbackText.trim() || submittingFeedback}
            >
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
