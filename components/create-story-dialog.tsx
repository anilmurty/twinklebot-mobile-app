"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sparkles, Loader2, ShoppingCart, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { storybooksApi, templatesApi, subscriptionPlansApi, subscriptionsApi, paymentsApi, profileApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { CouponInput } from "@/components/coupon-input"

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

type GenerationStep = "template-selection" | "generating-preview" | "payment"

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
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [hasPaymentOverride, setHasPaymentOverride] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; discount: { formatted: string } } | null>(null)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  useEffect(() => {
    if (open) {
      fetchTemplates()
      checkPaymentStatus()
      setCurrentStep("template-selection")
      setPreviewProgress(0)
      setStorybookId(null)
      setPreviewSceneUrl(null)
      setSelectedPlanId(null)
      setAppliedCoupon(null)
    }
  }, [open])

  const checkPaymentStatus = async () => {
    try {
      // Check subscription status
      const subscriptionStatus = await subscriptionsApi.getStatus()
      setHasActiveSubscription(subscriptionStatus.has_subscription || false)

      // Check payment override
      const profile = await profileApi.get()
      setHasPaymentOverride(profile?.payment_override === true)

      // Fetch subscription plans
      setLoadingPlans(true)
      const plansData = await subscriptionPlansApi.list()
      setSubscriptionPlans(plansData.plans || [])
      if (plansData.plans && plansData.plans.length > 0) {
        // Set default to first subscription plan, or first one-time if no subscriptions
        const subscriptionPlan = plansData.plans.find((p: any) => p.plan_type === 'subscription')
        const oneTimePlan = plansData.plans.find((p: any) => p.plan_type === 'one-time')
        setSelectedPlanId(subscriptionPlan?.id || oneTimePlan?.id || plansData.plans[0].id)
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
      setTemplates(data.templates || [])
      if (data.templates && data.templates.length > 0) {
        setSelectedTemplate(data.templates[0].id)
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

    try {
      setError(null)
      setCurrentStep("generating-preview")
      setPreviewProgress(0)

      // Step 1: Create storybook
      setPreviewProgress(10)
      const storybook = await storybooksApi.create(characterId, selectedTemplate)
      setStorybookId(storybook.id)

      // If user has payment override or subscription, skip preview and go straight to generation
      if (hasPaymentOverride || hasActiveSubscription) {
        // Generation will start automatically via the API
        onOpenChange(false)
        router.push("/?tab=storybooks")
        return
      }

      // Step 2: Generate preview
      setPreviewProgress(20)
      await storybooksApi.generatePreview(storybook.id)

      // Poll for preview completion
      let attempts = 0
      const maxAttempts = 1800 // 15 minutes max (500ms * 1800) - Replicate predictions can take up to 5 min each
      const pollInterval = setInterval(async () => {
        attempts++
        setPreviewProgress(Math.min(20 + (attempts / maxAttempts) * 70, 90))

        try {
          const storybookData = await storybooksApi.get(storybook.id)
          
          if (storybookData.status === 'preview_pending' && storybookData.scenes && storybookData.scenes.length > 0) {
            // Preview is ready
            clearInterval(pollInterval)
            setPreviewProgress(100)
            setPreviewSceneUrl(storybookData.scenes[0].image_url)
            setTimeout(() => setCurrentStep("payment"), 500)
          } else if (storybookData.status === 'failed') {
            clearInterval(pollInterval)
            setError(storybookData.error_message || "Preview generation failed")
            setCurrentStep("template-selection")
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setError("Preview generation is taking longer than expected. Please check back later.")
            setCurrentStep("template-selection")
          }
        } catch (err: any) {
          console.error("Error polling preview:", err)
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setError("Failed to check preview status")
            setCurrentStep("template-selection")
          }
        }
      }, 500)
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

      // Create checkout session
      const checkout = await paymentsApi.createCheckout(
        storybookId,
        planId,
        appliedCoupon?.id
      )

      // Redirect to Stripe checkout
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        setError("Failed to create checkout session")
      }
    } catch (err: any) {
      console.error("Failed to create checkout:", err)
      setError(err.message || "Failed to create checkout session. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleMaybeLater = () => {
    // Storybook is already saved as preview_pending, just close the dialog
    onOpenChange(false)
    router.push("/?tab=storybooks")
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)
  const sceneCount = selectedTemplateData?.script_data?.scenes?.length || selectedTemplateData?.scene_count || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {currentStep === "template-selection" && (
          <>
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
              <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg border border-accent">
                {characterPhotoUrl ? (
                  <img
                    src={characterPhotoUrl || "/placeholder.svg"}
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
                    <p className="text-sm text-muted-foreground">No story templates available.</p>
                  </Card>
                ) : (
                  <RadioGroup
                    value={selectedTemplate?.toString() || ""}
                    onValueChange={(value) => setSelectedTemplate(Number.parseInt(value))}
                  >
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
                  disabled={!selectedTemplate || isSubmitting || templates.length === 0}
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
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div className="h-1.5 flex-1 bg-muted rounded-full" />
              </div>

              <div className="relative aspect-[9/16] bg-gradient-to-br from-accent/50 to-secondary/50 rounded-xl overflow-hidden group">
                {previewSceneUrl ? (
                  <img
                    src={previewSceneUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                ) : characterPhotoUrl ? (
                  <img
                    src={characterPhotoUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-2">{selectedTemplateData?.title}</h3>
                    <p className="text-sm opacity-90">Starring {characterName}</p>
                  </div>
                </div>
                {previewSceneUrl && (
                  <button
                    onClick={() => setShowFullImage(true)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    View Full Image
                  </button>
                )}
              </div>

              {/* Full Image Modal */}
              <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
                <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-black/95">
                  <div className="relative w-full h-[90vh] flex items-center justify-center">
                    {previewSceneUrl && (
                      <img
                        src={previewSceneUrl}
                        alt="Story preview - full view"
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                    <button
                      onClick={() => setShowFullImage(false)}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                      aria-label="Close"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowFullImage(false)}
                      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Back to Purchase
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Choose Your Plan</Label>

                {loadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <Card className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No payment plans available.</p>
                  </Card>
                ) : (
                  <>
                    <RadioGroup
                      value={selectedPlanId?.toString() || ""}
                      onValueChange={(value) => setSelectedPlanId(Number.parseInt(value))}
                    >
                      <div className="space-y-3">
                        {subscriptionPlans.map((plan) => {
                          const isSelected = selectedPlanId === plan.id
                          const isSubscription = plan.plan_type === 'subscription'
                          const price = (plan.price_amount / 100).toFixed(2)
                          const features = plan.features || []

                          return (
                            <Card
                              key={plan.id}
                              className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                                isSelected ? 'border-2 border-primary bg-primary/5' : ''
                              } ${isSubscription && !isSelected ? 'border-2 border-primary/50 bg-primary/5' : ''}`}
                            >
                              <label className="flex items-start gap-4 cursor-pointer w-full">
                                <RadioGroupItem
                                  value={plan.id.toString()}
                                  id={`plan-${plan.id}`}
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg">{plan.name}</h4>
                                    {isSubscription && (
                                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                        Best Value
                                      </span>
                                    )}
                                  </div>
                                  {plan.description && (
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                  )}
                                  {features.length > 0 && (
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                      {features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-2">
                                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                          <span>{feature}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <div className="pt-2">
                                    <span className="text-2xl font-bold text-primary">${price}</span>
                                    {plan.billing_interval && (
                                      <span className="text-sm text-muted-foreground ml-1">
                                        /{plan.billing_interval}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                              <Button
                                className={`w-full mt-4 ${
                                  isSubscription
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'hover:bg-accent hover:border-primary'
                                }`}
                                variant={isSubscription ? 'default' : 'outline'}
                                size="lg"
                                onClick={() => handleCompletePurchase(plan.id)}
                                disabled={isSubmitting || !isSelected}
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    {isSubscription
                                      ? 'Subscribe & Generate Full Story'
                                      : 'Purchase & Generate Full Story'}
                                  </>
                                )}
                              </Button>
                            </Card>
                          )
                        })}
                      </div>
                    </RadioGroup>

                    <div className="pt-2">
                      <CouponInput
                        onCouponApplied={(coupon) => setAppliedCoupon(coupon)}
                        onCouponRemoved={() => setAppliedCoupon(null)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button variant="ghost" className="w-full" onClick={handleMaybeLater} disabled={isSubmitting}>
                Maybe Later
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
