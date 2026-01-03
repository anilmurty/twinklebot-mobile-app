"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { storybooksApi, templatesApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"

interface Template {
  id: number
  title: string
  description: string
  scene_count: number
  thumbnail_url?: string
  script_data?: any
}

interface CreateStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  characterId: string
  characterName: string
  characterPhotoUrl?: string
}

export function CreateStoryDialog({ open, onOpenChange, characterId, characterName, characterPhotoUrl }: CreateStoryDialogProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await templatesApi.list()
      setTemplates(data.templates || [])
      if (data.templates && data.templates.length > 0) {
        setSelectedTemplate(data.templates[0].id)
      }
    } catch (err: any) {
      console.error('Failed to fetch templates:', err)
      setError(err.message || 'Failed to load story templates')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a story template')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const result = await storybooksApi.create(characterId, selectedTemplate)
      
      onOpenChange(false)
      // Navigate to storybooks tab without full page reload
      router.push('/?tab=storybooks')
    } catch (err: any) {
      console.error('Failed to create storybook:', err)
      setError(err.message || 'Failed to create storybook. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  const sceneCount = selectedTemplateData?.script_data?.scenes?.length || selectedTemplateData?.scene_count || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Create Story
          </DialogTitle>
          <DialogDescription>
            Create a personalized story with <strong>{characterName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Selected Character Display */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {characterPhotoUrl ? (
              <img
                src={characterPhotoUrl}
                alt={characterName}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-muted-foreground">
                  {characterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{characterName}</p>
              <p className="text-xs text-muted-foreground">Selected character</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Label>Select Story Template</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No story templates available.
                </p>
              </Card>
            ) : (
              <RadioGroup value={selectedTemplate?.toString() || ""} onValueChange={(value) => setSelectedTemplate(parseInt(value))}>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <Card key={template.id} className="p-3 cursor-pointer hover:border-primary transition-colors">
                      <label className="flex items-center gap-3 cursor-pointer w-full">
                        <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} />
                        <div className="flex-1">
                          <div className="font-medium">{template.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {template.scene_count || template.script_data?.scenes?.length || 0} scenes
                          </div>
                        </div>
                      </label>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">What happens next?</h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Your story will be generated in the background</li>
              <li>You'll get a notification when it's ready</li>
              <li>Generation typically takes 5-10 minutes</li>
              <li>You can close the app during generation</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!selectedTemplate || isSubmitting || templates.length === 0}
              onClick={handleGenerate}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
