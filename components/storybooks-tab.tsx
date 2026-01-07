"use client"

import { BookOpen, Clock, CheckCircle2, Loader2, Trash2, Plus, Play, Share2, Copy, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useCallback, useRef } from "react"
import { storybooksApi, charactersApi, paymentsApi, subscriptionPlansApi } from "@/lib/api-client"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingCart, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CouponInput } from "@/components/coupon-input"
import { Progress } from "@/components/ui/progress"

interface Storybook {
  id: string
  title: string
  character_name: string
  status: string
  thumbnail_url?: string
  first_scene_image?: string
  first_scene_base_image?: string
  created_at: string
  scenes?: any[]
  progress?: number
  total_scenes?: number
  template?: {
    thumbnail_url?: string
  }
}

export function StorybooksTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [storybooks, setStorybooks] = useState<Storybook[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [charactersLoading, setCharactersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [resumeStorybook, setResumeStorybook] = useState<Storybook | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; discount: { formatted: string } } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const [shareUrl, setShareUrl] = useState<{ storybookId: string; url: string } | null>(null)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)

  const isFetchingRef = useRef(false)

  const fetchStorybooks = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      // Don't set loading to true on subsequent fetches to avoid UI flicker
      setError(null)
      const data = await storybooksApi.list()
      setStorybooks(data.storybooks || [])
    } catch (err: any) {
      console.error("Failed to fetch storybooks:", err)
      setError(err.message || "Failed to load storybooks")
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, []) // Empty deps - this function is stable

  const fetchCharacters = async () => {
    try {
      setCharactersLoading(true)
      const data = await charactersApi.list()
      setCharacters(data.characters || [])
    } catch (err: any) {
      console.error("Failed to fetch characters:", err)
    } finally {
      setCharactersLoading(false)
    }
  }

  useEffect(() => {
    fetchStorybooks()
    fetchCharacters()
  }, [fetchStorybooks])

  // Poll for updates every 3 seconds if there are generating storybooks
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if any storybooks are generating or pending preview
      const hasGenerating = storybooks.some((sb) => 
        sb.status === "generating" || 
        sb.status === "pending" || 
        sb.status === "preview_pending"
      )

      if (hasGenerating && !isFetchingRef.current) {
        fetchStorybooks()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [storybooks, fetchStorybooks]) // Add dependencies for proper polling

  // Refresh when tab becomes active (in case user navigated from story creation)
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "storybooks") {
      fetchStorybooks()
    }
  }, [searchParams, fetchStorybooks])

  const handleCreateCharacter = () => {
    router.push("/?tab=characters&create=true")
  }

  const handleCreateStorybook = () => {
    router.push("/?tab=library")
  }

  const handleCharacterCreated = () => {
    fetchCharacters()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
    return date.toLocaleDateString()
  }

  const handleReadStorybook = (id: string) => {
    window.location.href = `/storybook/${id}`
  }

  const handleGenerateShare = async (storybookId: string) => {
    try {
      setIsGeneratingShare(true)
      setCopiedShareUrl(false)
      const result = await storybooksApi.generateShare(storybookId)
      setShareUrl({ storybookId, url: result.share_url })
    } catch (err: any) {
      console.error("Failed to generate share link:", err)
      setError(err.message || "Failed to generate share link")
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl.url)
      setCopiedShareUrl(true)
      setTimeout(() => setCopiedShareUrl(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const handleRevokeShare = async () => {
    if (!shareUrl) return
    try {
      await storybooksApi.revokeShare(shareUrl.storybookId)
      setShareUrl(null)
      setCopiedShareUrl(false)
      // Refresh storybooks to reflect the change
      await fetchStorybooks()
    } catch (err: any) {
      console.error("Failed to revoke share link:", err)
      setError(err.message || "Failed to revoke share link")
    }
  }

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ id, title })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      await storybooksApi.delete(deleteConfirm.id)
      await fetchStorybooks()
    } catch (err: any) {
      alert(`Failed to delete storybook: ${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      const plansData = await subscriptionPlansApi.list()
      setSubscriptionPlans(plansData.plans || [])
      if (plansData.plans && plansData.plans.length > 0) {
        const subscriptionPlan = plansData.plans.find((p: any) => p.plan_type === 'subscription')
        const oneTimePlan = plansData.plans.find((p: any) => p.plan_type === 'one-time')
        setSelectedPlanId(subscriptionPlan?.id || oneTimePlan?.id || plansData.plans[0].id)
      }
    } catch (err: any) {
      console.error("Failed to fetch subscription plans:", err)
    }
  }

  const handleResumePurchase = async (planId: number) => {
    if (!resumeStorybook || !planId) {
      setPaymentError("Missing required information")
      return
    }

    try {
      setIsSubmitting(true)
      setPaymentError(null)

      const checkout = await paymentsApi.createCheckout(
        resumeStorybook.id,
        planId,
        appliedCoupon?.id
      )

      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
      } else {
        setPaymentError("Failed to create checkout session")
      }
    } catch (err: any) {
      console.error("Failed to create checkout:", err)
      setPaymentError(err.message || "Failed to create checkout session")
      setIsSubmitting(false)
    }
  }

  const handleResumeMaybeLater = () => {
    setResumeStorybook(null)
    setSelectedPlanId(null)
    setAppliedCoupon(null)
    setPaymentError(null)
  }

  const getThumbnailOverlay = (title: string) => {
    if (title.includes("Counting")) return { text: "1-10", color: "text-blue-600" }
    if (title.includes("Alphabet Adventure 1")) return { text: "A-I", color: "text-green-600" }
    if (title.includes("Alphabet Adventure 2")) return { text: "J-R", color: "text-purple-600" }
    if (title.includes("Alphabet Adventure 3")) return { text: "S-Z", color: "text-orange-600" }
    return null
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 to-background">
      <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">My Storybooks</h1>
          <p className="text-muted-foreground text-base md:text-lg">Your personalized adventure library</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchStorybooks} size="sm" className="mt-2">
              Retry
            </Button>
          </Card>
        ) : storybooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-secondary-foreground" />
            </div>
            <div className="text-center space-y-4">
              {charactersLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              ) : characters.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold">No Storybooks or Characters Yet</h3>
                  <Button
                    onClick={handleCreateCharacter}
                    className="w-full h-auto py-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Create First Character</span>
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">No Storybooks Yet</h3>
                  <Button
                    onClick={handleCreateStorybook}
                    className="w-full h-auto py-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Create First Storybook</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {storybooks.map((storybook) => {
              const sceneCount = storybook.scenes?.length || 0
              const progress = storybook.progress || 0
              const isGenerating = storybook.status === "generating" || storybook.status === "pending"
              const isCompleted = storybook.status === "completed"
              const isPreviewPending = storybook.status === "preview_pending"
              const isGeneratingPreview = isPreviewPending && sceneCount === 0 // Preview pending but no scenes yet = generating
              const isPreviewReady = isPreviewPending && sceneCount > 0 // Preview pending with scenes = ready
              // Use template cover image (thumbnail_url) when generating preview
              // Fallback to placeholder if not found
              // Otherwise use scene image or template thumbnail
              const thumbnailUrl = isGeneratingPreview 
                ? storybook.thumbnail_url || storybook.template?.thumbnail_url || storybook.first_scene_base_image
                : storybook.thumbnail_url || storybook.first_scene_image || (storybook.scenes && storybook.scenes[0]?.image_url)
              const overlay = getThumbnailOverlay(storybook.title)

              return (
                <Card key={storybook.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col p-4 md:p-6 w-full">
                    <div className="relative mx-auto mb-4">
                      {thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnailUrl || "/placeholder.svg"}
                            alt={storybook.title}
                            className="w-full aspect-[3/4] max-w-[200px] object-cover rounded-lg"
                          />
                          {overlay && (
                            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-2">
                              <span
                                className={`text-3xl font-black ${overlay.color} drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]`}
                              >
                                {overlay.text}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full aspect-[3/4] max-w-[200px] bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      {(isGenerating || isGeneratingPreview) && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg md:text-xl break-words line-clamp-2">
                            {storybook.title}
                          </h3>
                          <p className="text-sm text-muted-foreground break-words line-clamp-1">
                            Starring: {storybook.character_name}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(storybook.id, storybook.title)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {sceneCount > 0 && <span>{sceneCount} scenes</span>}
                          {sceneCount > 0 && <span>•</span>}
                          <span>{formatDate(storybook.created_at)}</span>
                        </div>
                      )}

                      {isCompleted ? (
                        <div className="space-y-2">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleReadStorybook(storybook.id)}
                            >
                              Read Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateShare(storybook.id)}
                              disabled={isGeneratingShare}
                            >
                              {isGeneratingShare ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Share2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : isPreviewReady ? (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Preview Ready
                          </Badge>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={async () => {
                              // Fetch fresh storybook data to ensure we have the latest preview scene
                              try {
                                const freshStorybook = await storybooksApi.get(storybook.id)
                                setResumeStorybook(freshStorybook)
                                // Fetch subscription plans if not already loaded
                                if (subscriptionPlans.length === 0) {
                                  await fetchSubscriptionPlans()
                                } else {
                                  // Ensure plans are loaded
                                  await fetchSubscriptionPlans()
                                }
                              } catch (err: any) {
                                console.error("Failed to fetch storybook:", err)
                                // Fallback to using the storybook from the list
                                setResumeStorybook(storybook)
                                await fetchSubscriptionPlans()
                              }
                            }}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            View Preview
                          </Button>
                        </div>
                      ) : isGeneratingPreview ? (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Generating Preview
                          </Badge>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setResumeStorybook(storybook)
                            }}
                          >
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            View Generation
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground break-words line-clamp-2 flex-1">
                              {progress < 100
                                ? progress <= 10
                                  ? "Starting character creation..."
                                  : progress <= 40
                                    ? "Generating character 1..."
                                    : progress <= 70
                                      ? "Generating character 2..."
                                      : "Generating character 3..."
                                : (() => {
                                    const sceneProgress = progress - 100
                                    if (sceneProgress <= 10) {
                                      return "Starting storybook generation..."
                                    }
                                    const totalScenes = storybook.total_scenes || storybook.scenes?.length || 10
                                    const sceneNumber = Math.ceil(((sceneProgress - 10) / 90) * totalScenes)
                                    return `Scene ${sceneNumber} of ${totalScenes}...`
                                  })()}
                            </span>
                            <span className="font-medium ml-2 shrink-0">
                              {progress < 100 ? progress : progress - 100}%
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.max(progress < 100 ? progress : progress - 100, 10)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <CreateCharacterDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCharacterCreated={handleCharacterCreated}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Storybook"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* Resume Story Creation Dialog */}
      <Dialog open={!!resumeStorybook} onOpenChange={(open) => !open && handleResumeMaybeLater()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Generating Preview"
                : "Complete Your Story"}
            </DialogTitle>
            <DialogDescription>
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Creating a magical preview just for you"
                : "Choose how you'd like to continue your adventure"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {resumeStorybook && (
              <>
                {resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0) ? (
                  // Show progress when generating preview
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative w-64 h-64 bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 rounded-3xl flex items-center justify-center overflow-hidden">
                      {(resumeStorybook.first_scene_base_image || resumeStorybook.thumbnail_url) ? (
                        <img
                          src={resumeStorybook.first_scene_base_image || resumeStorybook.thumbnail_url || "/placeholder.svg"}
                          alt={resumeStorybook.title}
                          className="w-full h-full object-cover rounded-3xl"
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Clock className="w-16 h-16 text-white animate-spin opacity-80" />
                      </div>
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                      <h3 className="text-xl font-bold">
                        Bringing {resumeStorybook.character_name} into {resumeStorybook.title}...
                      </h3>
                      <Progress value={resumeStorybook.progress || 0} className="w-full h-2" />
                      <p className="text-sm text-muted-foreground">{Math.round(resumeStorybook.progress || 0)}% complete</p>
                    </div>
                  </div>
                ) : (
                  // Show preview and payment options when ready
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-full max-w-xs mx-auto aspect-[9/16] bg-gradient-to-br from-accent/50 to-secondary/50 rounded-xl overflow-hidden group shadow-lg">
                        {resumeStorybook.scenes && resumeStorybook.scenes[0]?.image_url ? (
                          <img
                            src={resumeStorybook.scenes[0].image_url}
                            alt="Story preview"
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setShowFullImage(true)}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                          <div className="text-white">
                            <h3 className="text-xl font-bold mb-1">{resumeStorybook.title}</h3>
                            <p className="text-xs opacity-90">Starring {resumeStorybook.character_name}</p>
                          </div>
                        </div>
                        {resumeStorybook.scenes && resumeStorybook.scenes[0]?.image_url && (
                          <button
                            onClick={() => setShowFullImage(true)}
                            className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm text-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                            View Full
                          </button>
                        )}
                      </div>
                    </div>

                {/* Full Image Modal */}
                <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
                  <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-black/95">
                    <div className="relative w-full h-[90vh] flex items-center justify-center">
                      {resumeStorybook.scenes && resumeStorybook.scenes[0]?.image_url && (
                        <img
                          src={resumeStorybook.scenes[0].image_url}
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

                      {subscriptionPlans.length === 0 ? (
                        <Card className="p-4 text-center">
                          <p className="text-sm text-muted-foreground">Loading payment plans...</p>
                        </Card>
                      ) : (
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
                                      id={`resume-plan-${plan.id}`}
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
                                    onClick={() => handleResumePurchase(plan.id)}
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
                      )}

                      <div className="pt-2">
                        <CouponInput
                          onCouponApplied={(coupon) => setAppliedCoupon(coupon)}
                          onCouponRemoved={() => setAppliedCoupon(null)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                        <p className="text-sm text-destructive">{paymentError}</p>
                      </div>
                    )}

                    <Button variant="ghost" className="w-full" onClick={handleResumeMaybeLater} disabled={isSubmitting}>
                      Maybe Later
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share URL Dialog */}
      <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Storybook</DialogTitle>
            <DialogDescription>
              Copy this link to share your storybook with others. Anyone with this link can view it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={shareUrl?.url || ''}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={handleCopyShareUrl}
                variant={copiedShareUrl ? "default" : "outline"}
              >
                {copiedShareUrl ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="pt-2 border-t">
              <Button
                variant="destructive"
                onClick={handleRevokeShare}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Revoke Share Link
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Revoking will make this link invalid. Anyone who already has the link won't be able to access the storybook.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
