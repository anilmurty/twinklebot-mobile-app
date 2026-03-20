"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Loader2, ChevronDown } from "lucide-react"
import { LogoSpinner } from "@/components/logo-spinner"
import { Card } from "@/components/ui/card"
import { storybooksApi, templatesApi, subscriptionPlansApi, paymentsApi, profileApi, characterLooksApi, charactersApi } from "@/lib/api-client"
import { navigateToUrl } from "@/lib/utils/navigation"
import { isNativeApp } from "@/lib/utils/platform"
import { getIAPPackages, purchasePackage, type IAPPackage } from "@/lib/services/iap-service"
import { useStorybookStatus } from "@/lib/queries/use-storybooks"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { CompactPricing } from "@/components/compact-pricing"

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

type GenerationStep = "template-selection" | "look-selection" | "generating-preview" | "payment"

export function CreateStoryDialog({
  open,
  onOpenChange,
  characterId,
  characterName,
  characterPhotoUrl,
}: CreateStoryDialogProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<GenerationStep>("template-selection")
  const [previewProgress, setPreviewProgress] = useState(0)
  const [storybookId, setStorybookId] = useState<string | null>(null)
  const [previewSceneUrl, setPreviewSceneUrl] = useState<string | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [storyCredits, setStoryCredits] = useState(0)
  const [characterGender, setCharacterGender] = useState<'male' | 'female' | null>(null)
  const [looks, setLooks] = useState<any[]>([])
  const [selectedLookId, setSelectedLookId] = useState<number | null>(null)
  const [loadingLooks, setLoadingLooks] = useState(false)
  const [iapPackages, setIapPackages] = useState<IAPPackage[]>([])
  const [previewSceneText, setPreviewSceneText] = useState<string | null>(null)
  const [fetchingPreviewData, setFetchingPreviewData] = useState(false)

  // Poll for preview status while generating
  const shouldPollPreview = currentStep === "generating-preview" && !!storybookId
  const { data: previewStatusData } = useStorybookStatus(storybookId || '', shouldPollPreview)

  // React to preview status updates from the status endpoint (polls every 3s via TanStack Query)
  // This is the PRIMARY completion detection mechanism
  useEffect(() => {
    if (!previewStatusData || currentStep !== "generating-preview" || !storybookId) return

    // Update progress from server (only increase, never decrease)
    if (previewStatusData.progress > previewProgress) {
      setPreviewProgress(previewStatusData.progress)
    }

    // Handle failure
    if (previewStatusData.status === 'failed') {
      setError("Preview generation failed. Please try again.")
      setCurrentStep("look-selection")
      return
    }

    // Detect preview completion: current_scene > 0 means a scene image exists
    if (previewStatusData.current_scene > 0 && !fetchingPreviewData) {
      setFetchingPreviewData(true)
      setPreviewProgress(100)
      // Fetch full storybook data to get scene image URL and text
      storybooksApi.get(storybookId).then((storybook) => {
        const scenes = storybook.scenes || []
        if (scenes.length > 0) {
          setPreviewSceneUrl(scenes[0].image_url || null)
          setPreviewSceneText(scenes[0].text || null)
        }
        setCurrentStep("payment")
      }).catch((err) => {
        console.error("Failed to fetch preview data:", err)
        // Even if fetch fails, still transition — user can view preview from storybooks tab
        setCurrentStep("payment")
      })
    }
  }, [previewStatusData, currentStep, previewProgress, storybookId, fetchingPreviewData])

  useEffect(() => {
    if (open) {
      fetchTemplates()
      checkPaymentStatus()
      fetchCharacterGender()
      setCurrentStep("template-selection")
      setPreviewProgress(0)
      setStorybookId(null)
      setPreviewSceneUrl(null)
      setSelectedPlanId(null)
      setSelectedLookId(null)
      setLooks([])
      setStoryCredits(0)
      setPreviewSceneText(null)
      setFetchingPreviewData(false)
    }
  }, [open, characterId])

  const fetchCharacterGender = async () => {
    try {
      const character = await charactersApi.get(characterId)
      setCharacterGender(character.gender)
    } catch (err: any) {
      console.error("Failed to fetch character gender:", err)
    }
  }

  const fetchLooks = async (templateId: number, gender?: 'male' | 'female') => {
    // Use provided gender or fall back to characterGender state
    const genderToUse = gender || characterGender
    if (!genderToUse) {
      // If no gender available, try to fetch it
      try {
        const character = await charactersApi.get(characterId)
        const fetchedGender = character.gender as 'male' | 'female'
        if (fetchedGender) {
          setCharacterGender(fetchedGender)
          return await fetchLooks(templateId, fetchedGender)
        } else {
          setError("Failed to determine character gender")
          return
        }
      } catch (err: any) {
        console.error("Failed to fetch character gender:", err)
        setError("Failed to load character data")
        return
      }
    }
    
    try {
      setLoadingLooks(true)
      const data = await characterLooksApi.list(templateId, genderToUse)
      setLooks(data.looks || [])
      // Auto-select "original" if available, otherwise first look
      const originalLook = data.looks?.find((l: any) => l.is_original)
      if (originalLook) {
        setSelectedLookId(originalLook.id)
      } else if (data.looks && data.looks.length > 0) {
        setSelectedLookId(data.looks[0].id)
      }
    } catch (err: any) {
      console.error("Failed to fetch looks:", err)
      setError(err.message || "Failed to load character looks")
    } finally {
      setLoadingLooks(false)
    }
  }

  const handleTemplateSelected = async () => {
    if (!selectedTemplate) {
      setError("Please select a story template")
      return
    }
    
    // Fetch looks for this template (will fetch gender if needed)
    await fetchLooks(selectedTemplate)
    setCurrentStep("look-selection")
  }

  const checkPaymentStatus = async () => {
    try {
      // Check story credits
      const profile = await profileApi.get()
      setStoryCredits(profile?.story_credits || 0)

      // Fetch subscription plans (one-time only for Phase 1)
      setLoadingPlans(true)
      const plansData = await subscriptionPlansApi.list()
      // Filter to only show one-time plans
      const oneTimePlans = (plansData.plans || []).filter((p: any) => p.plan_type === 'one-time')
      setSubscriptionPlans(oneTimePlans)
      if (oneTimePlans.length > 0) {
        // Default to single storybook (1 credit) plan
        const singlePlan = oneTimePlans.find((p: any) => p.stories_per_period === 1)
        setSelectedPlanId(singlePlan?.id || oneTimePlans[0].id)
      }
      // Load IAP packages on native
      if (isNativeApp()) {
        const packages = await getIAPPackages()
        setIapPackages(packages)
      }
    } catch (err: any) {
      console.error("Failed to check payment status:", err)
    } finally {
      setLoadingPlans(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await templatesApi.list()
      // Filter out coming-soon templates (no script_data/scenes)
      const activeTemplates = (data.templates || []).filter((t: any) => !t.is_coming_soon)
      setTemplates(activeTemplates)
      if (activeTemplates.length > 0) {
        setSelectedTemplate(activeTemplates[0].id)
      }
    } catch (err: any) {
      console.error("Failed to fetch templates:", err)
      setError(err.message || "Failed to load story templates")
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePreview = async () => {
    if (!selectedTemplate) {
      setError("Please select a story template")
      return
    }

    if (!selectedLookId) {
      setError("Please select a character look")
      return
    }

    try {
      setError(null)
      setCurrentStep("generating-preview")
      setPreviewProgress(0)

      // Step 1: Create storybook with selected look
      setPreviewProgress(10)
      const storybook = await storybooksApi.create(characterId, selectedTemplate, selectedLookId)
      setStorybookId(storybook.id)

      // If the API started generation (status=pending), skip preview and navigate away
      if (storybook.status === 'pending') {
        onOpenChange(false)
        router.push("/app?tab=storybooks")
        return
      }

      // Step 2: Generate preview (async - don't wait)
      setPreviewProgress(20)
      storybooksApi.generatePreview(storybook.id).catch((err: any) => {
        console.error("Preview generation error:", err)
      })

      // Don't navigate automatically - let user close modal when ready
    } catch (err: any) {
      console.error("Failed to generate preview:", err)
      setError(err.message || "Failed to start preview generation")
      setCurrentStep("template-selection")
    }
  }

  const handleCompletePurchase = async (planId: number) => {
    if (!storybookId || !planId) {
      setError("Missing required information")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (isNativeApp()) {
        // Native IAP flow via RevenueCat
        const plan = subscriptionPlans.find((p: any) => p.id === planId)
        const credits = plan?.stories_per_period || 1
        const pkg = iapPackages.find((p) => p.credits === credits)

        if (!pkg) {
          console.error(`[IAP] No package found for ${credits} credits. Available:`, iapPackages.map(p => `${p.identifier}(${p.credits})`))
          setError("In-app purchases are not available right now. Please try again later.")
          setIsSubmitting(false)
          return
        }

        const success = await purchasePackage(pkg.identifier)
        if (success) {
          // Purchase succeeded — RevenueCat webhook will add credits,
          // auto-use one credit for the pending storybook, and start generation.
          // Just navigate to storybooks tab where polling will show progress.
          onOpenChange(false)
          router.push("/app?tab=storybooks")
        }
        setIsSubmitting(false)
      } else {
        // Web Stripe checkout flow
        const checkout = await paymentsApi.createCheckout(
          storybookId,
          planId
        )

        if (checkout.checkout_url) {
          await navigateToUrl(checkout.checkout_url)
        } else {
          setError("Failed to create checkout session")
        }
      }
    } catch (err: any) {
      console.error("Failed to create checkout:", err)
      setError(err.message || "Failed to create checkout session. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleUseCredit = async () => {
    if (!storybookId) {
      setError("Missing storybook information")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      await storybooksApi.useCredit(storybookId)
      
      // Navigate to storybooks tab
      onOpenChange(false)
      router.push("/app?tab=storybooks")
    } catch (err: any) {
      console.error("Failed to use credit:", err)
      setError(err.message || "Failed to use credit. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleMaybeLater = () => {
    // Storybook is already saved as preview_pending, just close the dialog
    onOpenChange(false)
    router.push("/app?tab=storybooks")
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)
  const sceneCount = selectedTemplateData?.script_data?.scenes?.length || selectedTemplateData?.scene_count || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {currentStep === "template-selection" && (
          <>
            <DialogHeader className="pb-0">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Create Story
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border border-accent">
                <p className="flex-1 text-sm font-medium min-w-0">
                  Choose a story where <span className="text-primary font-bold">{characterName}</span> will be the hero
                </p>
                {characterPhotoUrl ? (
                  <img
                    src={characterPhotoUrl || "/placeholder.svg"}
                    alt={characterName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-muted-foreground">
                      {characterName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <Label>Select Story Template</Label>
                  <span className="text-[10px] text-muted-foreground">(swipe vertically to see more)</span>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LogoSpinner size={48} />
                  </div>
                ) : templates.length === 0 ? (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No story templates available.</p>
                  </Card>
                ) : (
                  <div className="border border-accent rounded-lg overflow-hidden relative">
                    <RadioGroup
                      value={selectedTemplate?.toString() || ""}
                      onValueChange={(value) => setSelectedTemplate(Number.parseInt(value))}
                    >
                      <div className="space-y-1.5 p-2 max-h-[28vh] overflow-y-auto">
                        {templates.map((template) => (
                          <Card key={template.id} className="p-2 cursor-pointer hover:border-primary transition-colors">
                            <label className="flex items-center gap-2 cursor-pointer w-full">
                              <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} />
                              <span className="font-medium text-sm">{template.title}</span>
                            </label>
                          </Card>
                        ))}
                      </div>
                    </RadioGroup>
                    <div className="flex items-center justify-center gap-2 py-1 bg-gradient-to-t from-card to-transparent">
                      <span className="text-[10px] text-muted-foreground">Swipe on the list to view more</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-accent/30 rounded-lg p-4 space-y-2 border border-accent">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">What happens next?</h4>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>We'll generate a free preview of your storybook</li>
                  <li>Review it before generating the full story</li>
                  <li>Story generation takes 2-3 minutes</li>
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
                  onClick={handleTemplateSelected}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {currentStep === "look-selection" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Choose Character Look
              </DialogTitle>
              <DialogDescription>
                We will dress {characterName} in an attire you choose
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {loadingLooks ? (
                <div className="flex items-center justify-center py-8">
                  <LogoSpinner size={48} />
                </div>
              ) : looks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No looks available for this story.</p>
                </div>
              ) : (
                <div className="border border-accent rounded-lg overflow-hidden">
                  <RadioGroup
                    value={selectedLookId?.toString() || ""}
                    onValueChange={(value) => setSelectedLookId(Number.parseInt(value))}
                  >
                    <div className="grid grid-cols-2 gap-4 p-2 max-h-[50vh] overflow-y-auto">
                      {looks.map((look) => (
                        <Card
                          key={look.id}
                          className={`p-4 cursor-pointer transition-all ${
                            selectedLookId === look.id
                              ? "border-primary border-2 bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedLookId(look.id)}
                        >
                          <label className="flex flex-col items-center gap-3 cursor-pointer w-full">
                            <RadioGroupItem
                              value={look.id.toString()}
                              id={`look-${look.id}`}
                              className="sr-only"
                            />
                            <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                              {look.is_original && characterPhotoUrl ? (
                                <img
                                  src={characterPhotoUrl}
                                  alt={look.look_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : look.reference_image_url ? (
                                <img
                                  src={look.reference_image_url}
                                  alt={look.look_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error(`Failed to load image for look ${look.id} (${look.look_name}):`, look.reference_image_url)
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const parent = target.parentElement
                                    if (parent) {
                                      parent.innerHTML = '<span class="text-xs text-muted-foreground">Image not found</span>'
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">No image</span>
                              )}
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{look.look_name}</div>
                              {look.is_original && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Uses original photo
                                </div>
                              )}
                            </div>
                          </label>
                        </Card>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("template-selection")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGeneratePreview}
                  disabled={!selectedLookId || loadingLooks}
                  className="flex-1"
                >
                  {loadingLooks ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generate Preview
                    </>
                  )}
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
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${previewProgress >= 50 ? "bg-primary" : "bg-muted"}`}
                />
                <div className="h-1.5 flex-1 bg-muted rounded-full" />
              </div>

              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-64 h-64 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 rounded-3xl flex items-center justify-center overflow-hidden">
                  {characterPhotoUrl && (
                    <img
                      src={characterPhotoUrl || "/placeholder.svg"}
                      alt={characterName}
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary/30 shadow-lg"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin opacity-50" />
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-xl font-bold">
                    Bringing {characterName} into {selectedTemplateData?.title}...
                  </h3>
                  <Progress value={previewProgress} className="w-full h-2" />
                  <p className="text-sm text-muted-foreground">{Math.round(previewProgress)}% complete</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-center text-sm text-muted-foreground">
                  Feel free to close this. We will let you know when the preview is ready.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onOpenChange(false)
                      router.push("/app?tab=storybooks")
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Unlock Your Story</DialogTitle>
              <DialogDescription>
                A personalized keepsake starring {characterName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Inline scene-style preview */}
              {previewSceneUrl ? (
                <div className="rounded-xl overflow-hidden bg-black relative" style={{ minHeight: '280px' }}>
                  <img
                    src={previewSceneUrl}
                    alt={`${selectedTemplateData?.title} preview`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 pt-3 pb-6 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-white text-sm font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex-1 truncate">
                        {selectedTemplateData?.title}
                      </h2>
                      <div className="text-white text-[10px] font-medium shrink-0 bg-amber-600 px-2 py-0.5 rounded-full">
                        Preview
                      </div>
                    </div>
                  </div>
                  {previewSceneText && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pt-8 pb-3 z-10">
                      <div className="text-center">
                        {previewSceneText.split('\n\n').slice(0, 1).map((stanza: string, i: number) => (
                          <div key={i}>
                            {stanza.split('\n').filter((l: string) => l.trim()).slice(0, 2).map((line: string, j: number) => (
                              <p
                                key={j}
                                className="text-white text-xs leading-relaxed font-serif font-medium"
                                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Compact Pricing */}
              {loadingPlans ? (
                <div className="flex items-center justify-center py-6">
                  <LogoSpinner size={48} />
                </div>
              ) : (
                <CompactPricing
                  plans={subscriptionPlans}
                  selectedPlanId={selectedPlanId}
                  onPlanSelect={setSelectedPlanId}
                  onPurchase={handleCompletePurchase}
                  isSubmitting={isSubmitting}
                  storyCredits={storyCredits}
                  onUseCredit={handleUseCredit}
                  iapPriceMap={iapPackages.length > 0 ? Object.fromEntries(iapPackages.map(p => [p.credits, p.priceString])) : undefined}
                />
              )}

              {error && (
                <div className="p-2 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <Button variant="ghost" size="sm" className="w-full" onClick={handleMaybeLater} disabled={isSubmitting}>
                Maybe Later
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
