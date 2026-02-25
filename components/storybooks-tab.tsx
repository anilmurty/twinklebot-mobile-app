"use client"

import { BookOpen, Clock, Check, CheckCircle2, Loader2, Trash2, Plus, Play, Share2, Copy, X, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { paymentsApi, subscriptionPlansApi, storybooksApi, profileApi } from "@/lib/api-client"
import { navigateToUrl } from "@/lib/utils/navigation"
import { isNativeApp } from "@/lib/utils/platform"
import { getIAPPackages, purchasePackage, type IAPPackage } from "@/lib/services/iap-service"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CompactPricing } from "@/components/compact-pricing"
import { 
  useStorybooksWithPolling, 
  useDeleteStorybook, 
  useGenerateShare, 
  useRevokeShare 
} from "@/lib/queries"
import { useCharacters } from "@/lib/queries"

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
  share_token?: string | null
  template?: {
    thumbnail_url?: string
  }
}

export function StorybooksTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use TanStack Query for data fetching with automatic caching and smart polling
  const { 
    data: storybooksData, 
    isLoading: loading, 
    error: storybooksError,
    refetch: refetchStorybooks
  } = useStorybooksWithPolling()
  
  const { 
    data: charactersData, 
    isLoading: charactersLoading,
    refetch: refetchCharacters
  } = useCharacters()
  
  // Mutations for storybook actions
  const deleteStorybookMutation = useDeleteStorybook()
  const generateShareMutation = useGenerateShare()
  const revokeShareMutation = useRevokeShare()
  
  // Derive data from query results
  const storybooks = storybooksData?.storybooks || []
  const characters = charactersData?.characters || []
  const error = storybooksError?.message || null
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [resumeStorybook, setResumeStorybook] = useState<Storybook | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [storyCredits, setStoryCredits] = useState(0)
  const [showFullImage, setShowFullImage] = useState(false)
  const [shareModalStorybook, setShareModalStorybook] = useState<Storybook | null>(null)
  const [shareUrl, setShareUrl] = useState<{ storybookId: string; url: string } | null>(null)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)
  const [iapPackages, setIapPackages] = useState<IAPPackage[]>([])

  // Refresh when tab becomes active (in case user navigated from story creation)
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "storybooks") {
      refetchStorybooks()
    }
  }, [searchParams, refetchStorybooks])

  // Auto-update resumeStorybook from storybooks list polling data
  // This handles: (1) progress updates during generation, (2) preview completion detection
  useEffect(() => {
    if (!resumeStorybook) return
    const updated = storybooks.find((sb) => sb.id === resumeStorybook.id)
    if (!updated) return

    const hadNoScenes = !resumeStorybook.scenes || resumeStorybook.scenes.length === 0
    const nowHasScenes = updated.scenes && updated.scenes.length > 0

    // Preview just completed — fetch full storybook data with signed URLs
    if (hadNoScenes && nowHasScenes) {
      storybooksApi.get(updated.id).then((freshData: any) => {
        setResumeStorybook(freshData)
        // Load subscription plans for the payment step
        fetchSubscriptionPlans()
      }).catch(() => {
        // Fallback to list data
        setResumeStorybook(updated)
        fetchSubscriptionPlans()
      })
      return
    }

    // Update progress while still generating
    if (hadNoScenes && updated.progress !== resumeStorybook.progress) {
      setResumeStorybook(prev => prev ? { ...prev, progress: updated.progress } : prev)
    }
  }, [storybooks, resumeStorybook])

  const handleCreateCharacter = () => {
    router.push("/app?tab=characters&create=true")
  }

  const handleCreateStorybook = () => {
    router.push("/app?tab=library")
  }

  const handleCharacterCreated = () => {
    refetchCharacters()
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
    router.push(`/storybook/${id}`)
  }

  const handleOpenShareModal = (storybook: Storybook) => {
    setShareModalStorybook(storybook)
    // If share token exists, construct the share URL
    if (storybook.share_token) {
      const baseUrl = window.location.origin
      setShareUrl({ storybookId: storybook.id, url: `${baseUrl}/share/${storybook.share_token}` })
    } else {
      setShareUrl(null)
    }
    setCopiedShareUrl(false)
  }

  const handleCreateShare = async () => {
    if (!shareModalStorybook) return
    try {
      setIsGeneratingShare(true)
      setCopiedShareUrl(false)
      const result = await generateShareMutation.mutateAsync(shareModalStorybook.id)
      setShareUrl({ storybookId: shareModalStorybook.id, url: result.share_url })
      // Refresh storybooks list so card button updates to "Unshare"
      const { data: refreshedData } = await refetchStorybooks()
      const updatedStorybook = refreshedData?.storybooks?.find((sb: Storybook) => sb.id === shareModalStorybook.id)
      if (updatedStorybook) {
        setShareModalStorybook(updatedStorybook)
      }
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
    if (!shareModalStorybook) return
    try {
      await revokeShareMutation.mutateAsync(shareModalStorybook.id)
      setShareUrl(null)
      setCopiedShareUrl(false)
      // Refresh storybooks list so card button updates back to "Share"
      const { data: refreshedData } = await refetchStorybooks()
      const updatedStorybook = refreshedData?.storybooks?.find((sb: Storybook) => sb.id === shareModalStorybook.id)
      if (updatedStorybook) {
        setShareModalStorybook(updatedStorybook)
      }
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
      await deleteStorybookMutation.mutateAsync(deleteConfirm.id)
      // Query cache is automatically invalidated by the mutation
    } catch (err: any) {
      alert(`Failed to delete storybook: ${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const fetchSubscriptionPlans = async () => {
    try {
      // Fetch profile for story credits
      const profile = await profileApi.get()
      setStoryCredits(profile?.story_credits || 0)

      // Fetch subscription plans (one-time only for Phase 1)
      const plansData = await subscriptionPlansApi.list()
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

      if (isNativeApp()) {
        // Native IAP flow via RevenueCat
        const plan = subscriptionPlans.find((p: any) => p.id === planId)
        const credits = plan?.stories_per_period || 1
        const pkg = iapPackages.find((p) => p.credits === credits)

        if (!pkg) {
          setPaymentError("This package is not available for in-app purchase")
          setIsSubmitting(false)
          return
        }

        const success = await purchasePackage(pkg.identifier)
        if (success) {
          // Purchase succeeded — webhook will credit user server-side
          // Use a credit for this storybook
          await storybooksApi.useCredit(resumeStorybook.id)
          setResumeStorybook(null)
          refetchStorybooks()
        }
        setIsSubmitting(false)
      } else {
        // Web Stripe checkout flow
        const checkout = await paymentsApi.createCheckout(
          resumeStorybook.id,
          planId
        )

        if (checkout.checkout_url) {
          await navigateToUrl(checkout.checkout_url)
        } else {
          setPaymentError("Failed to create checkout session")
        }
      }
    } catch (err: any) {
      console.error("Failed to create checkout:", err)
      setPaymentError(err.message || "Failed to create checkout session")
      setIsSubmitting(false)
    }
  }

  const handleUseCredit = async () => {
    if (!resumeStorybook) {
      setPaymentError("Missing storybook information")
      return
    }

    try {
      setIsSubmitting(true)
      setPaymentError(null)

      await storybooksApi.useCredit(resumeStorybook.id)
      
      // Close dialog and refresh
      setResumeStorybook(null)
      refetchStorybooks()
    } catch (err: any) {
      console.error("Failed to use credit:", err)
      setPaymentError(err.message || "Failed to use credit")
      setIsSubmitting(false)
    }
  }

  const handleResumeMaybeLater = () => {
    setResumeStorybook(null)
    setSelectedPlanId(null)
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
      <div className="p-6 md:p-8 lg:p-10 pb-24 space-y-6 md:space-y-8">
        <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">My Storybooks</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => refetchStorybooks()} size="sm" className="mt-2">
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
          <>
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
                <Card key={storybook.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="flex flex-col p-4 md:p-6 w-full h-full">
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

                    <div className="flex flex-col flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg md:text-xl break-words line-clamp-2">
                            {storybook.title}
                          </h3>
                          <p className="text-base font-bold text-foreground break-words line-clamp-1">
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

                      {/* Push buttons to bottom */}
                      <div className="mt-auto">
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
                                Read
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenShareModal(storybook)}
                                className={`flex-1 ${storybook.share_token ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}`}
                              >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline ml-1">
                                  {storybook.share_token ? 'Edit Share' : 'Share'}
                                </span>
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
                                  ? "Preparing character..."
                                  : (() => {
                                      const completedScenes = storybook.scenes?.filter((s: any) => s.image_url)?.length || 0
                                      const totalScenes = storybook.total_scenes || 10
                                      if (completedScenes === 0) {
                                        return "Starting storybook generation..."
                                      }
                                      return `${completedScenes} of ${totalScenes} scenes...`
                                    })()}
                              </span>
                              <span className="font-medium ml-2 shrink-0">
                                {(() => {
                                  if (progress < 100) return `${progress}%`
                                  const completed = storybook.scenes?.filter((s: any) => s.image_url)?.length || 0
                                  const total = storybook.total_scenes || 10
                                  return `${Math.round((completed / total) * 100)}%`
                                })()}
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${(() => {
                                  if (progress < 100) return Math.max(progress, 10)
                                  const completed = storybook.scenes?.filter((s: any) => s.image_url)?.length || 0
                                  const total = storybook.total_scenes || 10
                                  return Math.max(Math.round((completed / total) * 100), 10)
                                })()}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
          </>
        )}
      </div>

      {/* Floating Action Button */}
      {storybooks.length > 0 && (
        <div
          className="fixed left-4 right-4 z-20 flex justify-center"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
        >
          <Button
            onClick={handleCreateStorybook}
            className="h-auto py-2.5 px-5 flex items-center justify-center gap-2 rounded-full shadow-lg border-0"
            style={{ backgroundColor: 'rgba(120, 53, 15, 0.85)', color: 'white' }}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Create New Storybook</span>
          </Button>
        </div>
      )}

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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Generating Preview"
                : "Unlock Your Story"}
            </DialogTitle>
            <DialogDescription>
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Creating a magical preview just for you"
                : `A personalized keepsake starring ${resumeStorybook?.character_name || 'your child'}`}
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
                    {/* Preview card */}
                    {resumeStorybook.scenes && resumeStorybook.scenes[0]?.image_url ? (
                      <div className="space-y-3">
                        <div
                          className="rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setShowFullImage(true)}
                        >
                          <img
                            src={resumeStorybook.scenes[0].image_url}
                            alt={`${resumeStorybook.title} preview`}
                            className="w-full h-auto"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowFullImage(true)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          View Full Preview
                        </Button>
                      </div>
                    ) : null}

                    {/* Full Preview Modal */}
                    <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
                      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
                        <DialogHeader>
                          <DialogTitle className="text-xl">{resumeStorybook.title}</DialogTitle>
                          <DialogDescription>
                            Starring {resumeStorybook.character_name || 'your child'} — Scene 1 Preview
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {resumeStorybook.scenes && resumeStorybook.scenes[0]?.image_url && (
                            <div className="rounded-lg overflow-hidden border border-border">
                              <img
                                src={resumeStorybook.scenes[0].image_url}
                                alt="Story preview"
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                          {resumeStorybook.scenes && resumeStorybook.scenes[0]?.text && (
                            <p className="text-sm leading-relaxed text-foreground/90 italic">
                              {resumeStorybook.scenes[0].text}
                            </p>
                          )}
                        </div>
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowFullImage(false)}
                          >
                            Back to Purchase
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Compact Pricing */}
                    {subscriptionPlans.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <CompactPricing
                        plans={subscriptionPlans}
                        selectedPlanId={selectedPlanId}
                        onPlanSelect={setSelectedPlanId}
                        onPurchase={handleResumePurchase}
                        isSubmitting={isSubmitting}
                        storyCredits={storyCredits}
                        onUseCredit={handleUseCredit}
                        iapPriceMap={iapPackages.length > 0 ? Object.fromEntries(iapPackages.map(p => [p.credits, p.priceString])) : undefined}
                      />
                    )}

                    {paymentError && (
                      <div className="p-2 bg-destructive/10 border border-destructive rounded-lg">
                        <p className="text-xs text-destructive">{paymentError}</p>
                      </div>
                    )}

                    <Button variant="ghost" size="sm" className="w-full" onClick={handleResumeMaybeLater} disabled={isSubmitting}>
                      Maybe Later
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link Modal */}
      <Dialog open={!!shareModalStorybook} onOpenChange={(open) => {
        if (!open) {
          setShareModalStorybook(null)
          setShareUrl(null)
          setCopiedShareUrl(false)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Link</DialogTitle>
            <DialogDescription>
              Generate a shareable link for your storybook. People who receive the link will be able to view the story without having to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {shareUrl ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl.url}
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
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateShare}
                    disabled={isGeneratingShare}
                    className="flex-1"
                  >
                    {isGeneratingShare ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-2" />
                        Re-Create
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRevokeShare}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateShare}
                  disabled={isGeneratingShare}
                  className="flex-1"
                >
                  {isGeneratingShare ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevokeShare}
                  disabled={true}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Revoke
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
