"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Loader2, ChevronDown } from "lucide-react"
import { LogoSpinner } from "@/components/logo-spinner"
import { Card } from "@/components/ui/card"
import { charactersApi, storybooksApi, subscriptionPlansApi, paymentsApi, profileApi, characterLooksApi } from "@/lib/api-client"
import { navigateToUrl } from "@/lib/utils/navigation"
import { isNativeApp } from "@/lib/utils/platform"
import { getIAPPackages, purchasePackage, type IAPPackage } from "@/lib/services/iap-service"
import { useCharacters } from "@/lib/queries/use-characters"
import { useStorybookStatus } from "@/lib/queries/use-storybooks"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { CompactPricing } from "@/components/compact-pricing"

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

type GenerationStep = "character-selection" | "look-selection" | "generating-preview" | "payment"

export function GenerateStoryDialog({ open, onOpenChange, story }: GenerateStoryDialogProps) {
  const router = useRouter()
  const { data: charactersData, isLoading: loadingCharacters } = useCharacters()
  const characters = charactersData?.characters || []
  const [selectedCharacter, setSelectedCharacter] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<GenerationStep>("character-selection")
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
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('premium')
  const [premiumCredits, setPremiumCredits] = useState(0)

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
      checkPaymentStatus()
      setCurrentStep("character-selection")
      setPreviewProgress(0)
      setStorybookId(null)
      setPreviewSceneUrl(null)
      setSelectedPlanId(null)
      setSelectedLookId(null)
      setStoryCredits(0)
      setLooks([])
      setCharacterGender(null)
      setPreviewSceneText(null)
      setFetchingPreviewData(false)
      setSelectedTier('premium')
      setPremiumCredits(0)
    }
  }, [open, story.id])

  // Auto-select first character when characters are loaded
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0].id)
    }
  }, [characters, selectedCharacter])

  const fetchCharacterGender = async (characterId: string) => {
    try {
      const character = await charactersApi.get(characterId)
      setCharacterGender(character.gender)
      return character.gender
    } catch (err: any) {
      console.error("Failed to fetch character gender:", err)
      return null
    }
  }

  const fetchLooks = async (templateId: number, gender: 'male' | 'female') => {
    try {
      setLoadingLooks(true)
      const data = await characterLooksApi.list(templateId, gender)
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

  const handleCharacterSelected = async () => {
    if (!selectedCharacter) {
      setError("Please select a character")
      return
    }
    
    // Fetch character gender and looks
    const gender = await fetchCharacterGender(selectedCharacter)
    if (gender) {
      await fetchLooks(story.id, gender)
      setCurrentStep("look-selection")
    } else {
      setError("Failed to load character data")
    }
  }

  const checkPaymentStatus = async () => {
    try {
      // Check payment override and story credits
      const profile = await profileApi.get()
      setStoryCredits(profile?.basic_credits || profile?.story_credits || 0)
      setPremiumCredits(profile?.premium_credits || 0)

      // Fetch subscription plans (one-time only for Phase 1)
      setLoadingPlans(true)
      const plansData = await subscriptionPlansApi.list()
      // Filter to only show one-time plans
      const oneTimePlans = (plansData.plans || []).filter((p: any) => p.plan_type === 'one-time')
      setSubscriptionPlans(oneTimePlans)
      // Default to single storybook (1 credit) plan for the selected tier
      const tierPlans = oneTimePlans.filter((p: any) => p.quality_tier === selectedTier)
      const plansToSearch = tierPlans.length > 0 ? tierPlans : oneTimePlans
      if (plansToSearch.length > 0) {
        const singlePlan = plansToSearch.find((p: any) => p.stories_per_period === 1)
        setSelectedPlanId(singlePlan?.id || plansToSearch[0].id)
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

  const handleGeneratePreview = async () => {
    if (!selectedCharacter) {
      setError("Please select a character")
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
      const storybook = await storybooksApi.create(selectedCharacter, story.id, selectedLookId)
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
      setCurrentStep("character-selection")
    }
  }

  const handleTierChange = (tier: 'basic' | 'premium') => {
    setSelectedTier(tier)
    // Update selected plan to match new tier
    const tierPlans = subscriptionPlans.filter((p: any) => p.quality_tier === tier)
    if (tierPlans.length > 0) {
      const singlePlan = tierPlans.find((p: any) => p.stories_per_period === 1)
      setSelectedPlanId(singlePlan?.id || tierPlans[0].id)
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
        // Find IAP package matching credits AND tier
        const pkg = iapPackages.find((p) => p.credits === credits && p.tier === selectedTier)
          // Fallback: match by credits only (for legacy packages)
          || iapPackages.find((p) => p.credits === credits)

        if (!pkg) {
          console.error(`[IAP] No package found for ${credits} ${selectedTier} credits. Available:`, iapPackages.map(p => `${p.identifier}(${p.credits},${p.tier})`))
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

  const handleUseCredit = async (tier?: 'basic' | 'premium') => {
    if (!storybookId) {
      setError("Missing storybook information")
      return
    }

    const useTier = tier || selectedTier

    try {
      setIsSubmitting(true)
      setError(null)

      await storybooksApi.useCredit(storybookId, useTier)

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

              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <Label>Select Character</Label>
                  {characters.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">(swipe to see more)</span>
                  )}
                </div>
                {loadingCharacters ? (
                  <div className="flex items-center justify-center py-8">
                    <LogoSpinner size={48} />
                  </div>
                ) : characters.length === 0 ? (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No characters available. Please create a character first.
                    </p>
                  </Card>
                ) : (
                  <div className="border border-accent rounded-lg overflow-clip">
                    <div className={`p-2 max-h-[28vh] overflow-y-auto ${
                      characters.length > 9
                        ? "grid grid-cols-3 gap-2"
                        : characters.length > 4
                          ? "grid grid-cols-2 gap-2"
                          : "space-y-2"
                    }`}>
                      {characters.map((character) => {
                        const isCompact = characters.length > 4
                        const isSelected = selectedCharacter === character.id
                        return (
                          <Card
                            key={character.id}
                            className={`p-3 cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary border-2 bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedCharacter(character.id)}
                          >
                            <div className={`flex w-full ${
                              isCompact
                                ? "flex-col items-center gap-2 text-center"
                                : "items-center gap-3"
                            }`}>
                              <img
                                src={character.front_photo_url || "/placeholder.svg"}
                                alt={character.name}
                                className={`rounded-full object-cover border-2 ${
                                  isSelected ? "border-primary" : "border-primary/20"
                                } ${characters.length > 9 ? "w-10 h-10" : "w-12 h-12"}`}
                              />
                              <span className={`font-medium ${isCompact ? "text-xs truncate w-full" : ""}`}>
                                {character.name}
                              </span>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                    {characters.length > 4 && (
                      <div className="flex items-center justify-center gap-2 py-1 bg-gradient-to-t from-card to-transparent">
                        <span className="text-[10px] text-muted-foreground">Swipe to view more</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground animate-bounce" />
                      </div>
                    )}
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
                  disabled={!selectedCharacter || isSubmitting || characters.length === 0}
                  onClick={handleCharacterSelected}
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
                We will dress {selectedCharacterData?.name} in an attire you choose
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
                              {look.is_original && selectedCharacterData?.front_photo_url ? (
                                <img
                                  src={selectedCharacterData.front_photo_url}
                                  alt={look.look_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : look.reference_image_url ? (
                                <img
                                  src={look.reference_image_url}
                                  alt={look.look_name}
                                  className="w-full h-full object-cover"
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
            </div>

            <div className="flex justify-between gap-2 mt-6">
              <Button variant="outline" onClick={() => setCurrentStep("character-selection")}>
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={selectedLookId === null || loadingLooks || isSubmitting}
                onClick={handleGeneratePreview}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Preview
              </Button>
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
                A personalized keepsake starring {selectedCharacterData?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Inline scene-style preview or cover image fallback */}
              {(previewSceneUrl || story.script_data?.[0]?.base_photo) ? (
                <div className="rounded-xl overflow-hidden bg-black relative" style={{ minHeight: '280px' }}>
                  <img
                    src={previewSceneUrl || "/placeholder.svg"}
                    alt={`${story.title} preview`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 pt-3 pb-6 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-white text-sm font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex-1 truncate">
                        {story.title}
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
                  premiumCredits={premiumCredits}
                  onUseCredit={handleUseCredit}
                  selectedTier={selectedTier}
                  onTierChange={handleTierChange}
                  iapPriceMap={iapPackages.length > 0 ? Object.fromEntries(
                    iapPackages
                      .filter(p => p.tier === selectedTier)
                      .map(p => [p.credits, p.priceString])
                  ) : undefined}
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
