"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Loader2, ShoppingCart, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { charactersApi, storybooksApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface Character {
  id: string
  name: string
  front_photo_url: string
}

interface GenerateStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  story: {
    id: number
    title: string
    description: string
    script_data?: any[]
  }
}

type GenerationStep = "character-selection" | "generating-preview" | "payment"

export function GenerateStoryDialog({ open, onOpenChange, story }: GenerateStoryDialogProps) {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<GenerationStep>("character-selection")
  const [previewProgress, setPreviewProgress] = useState(0)

  useEffect(() => {
    if (open) {
      fetchCharacters()
      setCurrentStep("character-selection")
      setPreviewProgress(0)
    }
  }, [open])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await charactersApi.list()
      setCharacters(data.characters || [])
      if (data.characters && data.characters.length > 0) {
        setSelectedCharacter(data.characters[0].id)
      }
    } catch (err: any) {
      console.error("Failed to fetch characters:", err)
      setError(err.message || "Failed to load characters")
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!selectedCharacter) {
      setError("Please select a character")
      return
    }

    setCurrentStep("generating-preview")
    setPreviewProgress(0)

    // Simulate preview generation with progress
    const progressInterval = setInterval(() => {
      setPreviewProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          // Move to payment step after preview is complete
          setTimeout(() => setCurrentStep("payment"), 500)
          return 100
        }
        return prev + 10
      })
    }, 400)
  }

  const handleCompletePurchase = async (purchaseType: "subscribe" | "one-time") => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Here you would handle the actual payment processing
      console.log(`Processing ${purchaseType} purchase...`)

      const result = await storybooksApi.create(selectedCharacter, story.id)

      onOpenChange(false)
      router.push("/?tab=storybooks")
    } catch (err: any) {
      console.error("Failed to create storybook:", err)
      setError(err.message || "Failed to create storybook. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCharacterData = characters.find((c) => c.id === selectedCharacter)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {currentStep === "character-selection" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Generate Story
              </DialogTitle>
              <DialogDescription>
                Create a personalized version of <strong>{story.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label>Select Character</Label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : characters.length === 0 ? (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No characters available. Please create a character first.
                    </p>
                  </Card>
                ) : (
                  <RadioGroup value={selectedCharacter} onValueChange={setSelectedCharacter}>
                    <div className="space-y-2">
                      {characters.map((character) => (
                        <Card key={character.id} className="p-3 cursor-pointer hover:border-primary transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer w-full">
                            <RadioGroupItem value={character.id} id={`char-${character.id}`} />
                            <img
                              src={character.front_photo_url || "/placeholder.svg"}
                              alt={character.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                            />
                            <span className="font-medium">{character.name}</span>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </div>

              <div className="bg-accent/30 rounded-lg p-4 space-y-2 border border-accent">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">What happens next?</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>We'll generate a preview with your character and the first scene</li>
                  <li>Review the preview before purchasing the full story</li>
                  <li>Full story generation typically takes 5-10 minutes</li>
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
                  disabled={!selectedCharacter || isSubmitting || characters.length === 0}
                  onClick={handleGeneratePreview}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate
                </Button>
              </div>
            </div>
          </>
        )}

        {currentStep === "generating-preview" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Generating Preview</DialogTitle>
              <DialogDescription>Creating a magical preview just for you</DialogDescription>
            </DialogHeader>

            <div className="space-y-8 py-8">
              {/* Progress indicator with 3 segments */}
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${previewProgress >= 50 ? "bg-primary" : "bg-muted"}`}
                />
                <div className="h-1.5 flex-1 bg-muted rounded-full" />
              </div>

              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-64 h-64 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 rounded-3xl flex items-center justify-center overflow-hidden">
                  {selectedCharacterData && (
                    <img
                      src={selectedCharacterData.front_photo_url || "/placeholder.svg"}
                      alt={selectedCharacterData.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/30 shadow-lg"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin opacity-50" />
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-xl font-bold">
                    Bringing {selectedCharacterData?.name} into {story.title}...
                  </h3>
                  <Progress value={previewProgress} className="w-full h-2" />
                  <p className="text-sm text-muted-foreground">{previewProgress}% complete</p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Complete Your Story</DialogTitle>
              <DialogDescription>Choose how you'd like to continue your adventure</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
              {/* Preview complete indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div className="h-1.5 flex-1 bg-muted rounded-full" />
              </div>

              {/* Mock preview image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/50 to-secondary/50 rounded-xl overflow-hidden">
                {selectedCharacterData && (
                  <img
                    src={selectedCharacterData.front_photo_url || "/placeholder.svg"}
                    alt="Story preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-2">{story.title}</h3>
                    <p className="text-sm opacity-90">Starring {selectedCharacterData?.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Your Plan</Label>

                {/* Subscribe option */}
                <Card className="p-4 cursor-pointer hover:border-primary transition-colors border-2 border-primary bg-primary/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">Subscribe & Save</h4>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          Best Value
                        </span>
                      </div>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>A new adventure starring your child, every month</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>Save 40% per story with subscriber pricing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>High-quality keepsakes they'll treasure forever</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>Cancel anytime - no commitment</span>
                        </li>
                      </ul>
                      <div className="pt-2">
                        <span className="text-2xl font-bold text-primary">$24.99</span>
                        <span className="text-sm text-muted-foreground line-through ml-2">$39.99</span>
                        <span className="text-sm text-muted-foreground ml-1">/month</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={() => handleCompletePurchase("subscribe")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Subscribe & Generate Full Story
                      </>
                    )}
                  </Button>
                </Card>

                {/* One-time purchase */}
                <Card className="p-4 cursor-pointer hover:border-primary transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-bold text-lg">One-Time Purchase</h4>
                      <p className="text-sm text-muted-foreground">Purchase just this story without a subscription</p>
                      <div className="pt-2">
                        <span className="text-2xl font-bold">$39.99</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 bg-transparent"
                    size="lg"
                    onClick={() => handleCompletePurchase("one-time")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Purchase & Generate Full Story
                      </>
                    )}
                  </Button>
                </Card>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Maybe Later
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
