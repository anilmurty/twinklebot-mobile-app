"use client"

import { BookOpen, Clock, Check, CheckCircle2, Loader2, Trash2, Plus, Play, Share2, Copy, X, Sparkles, Eye } from "lucide-react"
import { LogoSpinner } from "@/components/logo-spinner"
import { ImageWithShimmer } from "@/components/ui/image-shimmer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { paymentsApi, subscriptionPlansApi, storybooksApi, profileApi } from "@/lib/api-client"
import { navigateToUrl } from "@/lib/utils/navigation"
import { isNativeApp } from "@/lib/utils/platform"
import { trackEvent } from "@/lib/utils/analytics"
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
  style?: string
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
  const [shareModalStorybook, setShareModalStorybook] = useState<Storybook | null>(null)
  const [shareUrl, setShareUrl] = useState<{ storybookId: string; url: string } | null>(null)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  const [copiedShareUrl, setCopiedShareUrl] = useState(false)
  const [iapPackages, setIapPackages] = useState<IAPPackage[]>([])
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('premium')
  const [premiumCredits, setPremiumCredits] = useState(0)

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
    router.push("/app?tab=library&create=true")
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
    trackEvent("share_modal_opened", { storybook_id: storybook.id })
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
      trackEvent("share_link_created", { storybook_id: shareModalStorybook.id })
      setShareUrl({ storybookId: shareModalStorybook.id, url: result.share_url })
      // Refresh storybooks list so card button updates to "Unshare"
      const { data: refreshedData } = await refetchStorybooks()
      const updatedStorybook = refreshedData?.storybooks?.find((sb: Storybook) => sb.id === shareModalStorybook.id)
      if (updatedStorybook) {
        setShareModalStorybook(updatedStorybook)
      }
    } catch (err: any) {
      console.error("Failed to generate share link:", err)
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return
    try {
      // Try modern clipboard API first
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl.url)
      } else {
        // Fallback for iOS WebView / older browsers
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl.url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      trackEvent("share_link_copied", { storybook_id: shareUrl.storybookId })
      setCopiedShareUrl(true)
      setTimeout(() => setCopiedShareUrl(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const handleRevokeShare = async () => {
    if (!shareModalStorybook) return
    try {
      trackEvent("share_link_revoked", { storybook_id: shareModalStorybook.id })
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
      setStoryCredits(profile?.basic_credits || profile?.story_credits || 0)
      setPremiumCredits(profile?.premium_credits || 0)

      // Fetch subscription plans (one-time only for Phase 1)
      const plansData = await subscriptionPlansApi.list()
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
      console.error("Failed to fetch subscription plans:", err)
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
        // Find IAP package matching credits AND tier
        const pkg = iapPackages.find((p) => p.credits === credits && p.tier === selectedTier)
          // Fallback: match by credits only (for legacy packages)
          || iapPackages.find((p) => p.credits === credits)

        if (!pkg) {
          console.error(`[IAP] No package found for ${credits} ${selectedTier} credits. Available:`, iapPackages.map(p => `${p.identifier}(${p.credits},${p.tier})`))
          setPaymentError("In-app purchases are not available right now. Please try again later.")
          setIsSubmitting(false)
          return
        }

        const success = await purchasePackage(pkg.identifier)
        if (success) {
          // Purchase succeeded — RevenueCat webhook will add credits,
          // auto-use one credit for the pending storybook, and start generation.
          // Just close dialog and let polling show progress.
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

  const handleUseCredit = async (tier?: 'basic' | 'premium') => {
    if (!resumeStorybook) {
      setPaymentError("Missing storybook information")
      return
    }

    const useTier = tier || selectedTier

    try {
      setIsSubmitting(true)
      setPaymentError(null)

      await storybooksApi.useCredit(resumeStorybook.id, useTier)

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

  // Derive storybook status helpers
  const getStorybookStatus = (storybook: Storybook) => {
    const sceneCount = storybook.scenes?.length || 0
    const isGenerating = storybook.status === "generating" || storybook.status === "pending"
    const isCompleted = storybook.status === "completed"
    const isPreviewPending = storybook.status === "preview_pending"
    const isGeneratingPreview = isPreviewPending && sceneCount === 0
    const isPreviewReady = isPreviewPending && sceneCount > 0
    const thumbnailUrl = isGeneratingPreview
      ? storybook.thumbnail_url || storybook.template?.thumbnail_url || storybook.first_scene_base_image
      : storybook.thumbnail_url || storybook.first_scene_image || (storybook.scenes && storybook.scenes[0]?.image_url)
    return { sceneCount, isGenerating, isCompleted, isPreviewPending, isGeneratingPreview, isPreviewReady, thumbnailUrl }
  }

  const handleViewPreview = (storybook: Storybook) => {
    router.push(`/storybook/${storybook.id}`)
  }

  // Group storybooks
  const inProgressBooks = storybooks.filter(sb => {
    const { isCompleted } = getStorybookStatus(sb)
    return !isCompleted
  })
  const completedBooks = storybooks.filter(sb => {
    const { isCompleted } = getStorybookStatus(sb)
    return isCompleted
  })

  return (
    <div className="min-h-full">
      <div className="p-6 md:p-8 lg:p-10 pb-24 space-y-8 md:space-y-10">
        <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>My Storybooks</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LogoSpinner />
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
                <LogoSpinner size={48} />
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
                  <p className="text-sm text-muted-foreground">Or</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/app?tab=library")}
                    className="w-full h-auto py-4 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">Browse Storybook Library</span>
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
                  <p className="text-sm text-muted-foreground">Or</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/app?tab=library")}
                    className="w-full h-auto py-4 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">Browse Storybook Library</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* In Progress section */}
            {inProgressBooks.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold text-2xl md:text-3xl px-1 text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  In Progress
                </h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
                  {inProgressBooks.map((storybook) => {
                    const { isGenerating, isGeneratingPreview, isPreviewReady, thumbnailUrl } = getStorybookStatus(storybook)
                    // For full generation: derive progress from scene count
                    // Start at 10% (preview exists), each additional scene adds equal share up to 100%
                    const totalScenes = storybook.total_scenes || 10
                    const scenesDone = storybook.scenes?.length || 0
                    const progress = isGenerating
                      ? Math.min(Math.round((scenesDone / totalScenes) * 100), 100)
                      : Math.min(storybook.progress || 0, 100)

                    return (
                      <div key={storybook.id} className="flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-[280px] lg:w-[260px] snap-start group">
                        {/* Image area */}
                        <div
                          className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => isPreviewReady ? handleViewPreview(storybook) : setResumeStorybook(storybook)}
                        >
                          {thumbnailUrl ? (
                            <ImageWithShimmer
                              src={thumbnailUrl}
                              alt={storybook.title}
                              className="w-full h-full object-cover"
                              containerClassName="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-white/30" />
                            </div>
                          )}
                          {/* Generating overlay */}
                          {(isGenerating || isGeneratingPreview) && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                              <Clock className="w-10 h-10 text-white animate-spin" />
                              <div className="w-3/4">
                                <div className="w-full bg-white/20 rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.max(progress, 5)}%` }}
                                  />
                                </div>
                                <p className="text-white/70 text-xs text-center mt-1">
                                  {isGeneratingPreview ? 'Generating Preview...' : 'Generating Full Story...'} {progress}%
                                </p>
                              </div>
                            </div>
                          )}
                          {/* Preview ready badge */}
                          {isPreviewReady && (
                            <div className="absolute top-3 right-3">
                              <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                Preview Ready
                              </span>
                            </div>
                          )}
                          {/* Bottom gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                        {/* Title + character + style below image */}
                        <div className="mt-2.5 px-1">
                          <h3 className="font-semibold text-base leading-tight line-clamp-2 min-h-[2lh] text-foreground">
                            {storybook.title}
                          </h3>
                          <p className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase">
                            <span className="text-muted-foreground">STARRING</span>
                            <span className="text-primary"> · {storybook.character_name}</span>
                          </p>
                          {storybook.style && storybook.style !== 'natural' && (
                            <p className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase">
                              <span className="text-muted-foreground">STYLE</span>
                              <span className="text-primary"> · {storybook.style === 'comic-book' ? 'Comic Book' : storybook.style.charAt(0).toUpperCase() + storybook.style.slice(1)}</span>
                            </p>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-2 px-1">
                          {isPreviewReady ? (
                            <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleViewPreview(storybook)}>
                              <Play className="w-3 h-3 mr-1" />
                              View Preview
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setResumeStorybook(storybook)}>
                              <Clock className="w-3 h-3 mr-1 animate-spin" />
                              {isGeneratingPreview ? "Generating Preview..." : isGenerating ? "Generating Story..." : "In Progress"}
                            </Button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(storybook.id, storybook.title)}
                            className="shrink-0 h-8 w-9 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Ready to Read section */}
            {completedBooks.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold text-2xl md:text-3xl px-1 text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  Ready to Read
                </h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
                  {completedBooks.map((storybook) => {
                    const { sceneCount, thumbnailUrl } = getStorybookStatus(storybook)

                    return (
                      <div key={storybook.id} className="flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-[280px] lg:w-[260px] snap-start group">
                        {/* Image area */}
                        <div
                          className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                          onClick={() => handleReadStorybook(storybook.id)}
                        >
                          {thumbnailUrl ? (
                            <ImageWithShimmer
                              src={thumbnailUrl}
                              alt={storybook.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              containerClassName="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/10 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-white/30" />
                            </div>
                          )}
                          {/* Bottom gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReadStorybook(storybook.id) }}
                              className="px-4 py-2 rounded-full bg-white/90 text-gray-900 text-sm font-semibold hover:bg-white transition-colors"
                            >
                              Read
                            </button>
                          </div>
                        </div>
                        {/* Title + character below image */}
                        <div className="mt-2.5 px-1">
                          <h3 className="font-semibold text-base leading-tight line-clamp-2 min-h-[2lh] text-foreground">
                            {storybook.title}
                          </h3>
                          <p className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase">
                            <span className="text-muted-foreground">STARRING</span>
                            <span className="text-primary"> · {storybook.character_name}</span>
                          </p>
                          {storybook.style && storybook.style !== 'natural' && (
                            <p className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase">
                              <span className="text-muted-foreground">STYLE</span>
                              <span className="text-primary"> · {storybook.style === 'comic-book' ? 'Comic Book' : storybook.style.charAt(0).toUpperCase() + storybook.style.slice(1)}</span>
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {sceneCount} scenes · {formatDate(storybook.created_at)}
                          </p>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-2 px-1">
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleReadStorybook(storybook.id)}>
                            <BookOpen className="w-3 h-3 mr-1" />
                            Read
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`flex-1 h-8 text-xs ${storybook.share_token ? 'border-green-500/50 text-green-400' : ''}`}
                            onClick={() => handleOpenShareModal(storybook)}
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            {storybook.share_token ? 'Shared' : 'Share'}
                          </Button>
                          <button
                            onClick={() => handleDeleteClick(storybook.id, storybook.title)}
                            className="shrink-0 h-8 w-9 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      {storybooks.length > 0 && (
        <div
          className="fixed left-4 right-4 z-40 flex justify-center pointer-events-none"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
        >
          <Button
            onClick={handleCreateStorybook}
            className="h-auto py-2.5 px-5 flex items-center justify-center gap-2 rounded-full shadow-lg border-0 bg-primary text-primary-foreground pointer-events-auto"
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
        <DialogContent className="max-w-[min(28rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Generating Preview"
                : (resumeStorybook?.status === 'generating' || resumeStorybook?.status === 'pending')
                  ? "Generating Your Story"
                  : "Unlock Your Story"}
            </DialogTitle>
            <DialogDescription>
              {resumeStorybook && resumeStorybook.status === 'preview_pending' && (!resumeStorybook.scenes || resumeStorybook.scenes.length === 0)
                ? "Creating a magical preview just for you"
                : (resumeStorybook?.status === 'generating' || resumeStorybook?.status === 'pending')
                  ? `Creating ${resumeStorybook?.title} starring ${resumeStorybook?.character_name || 'your child'}`
                  : `A personalized keepsake starring ${resumeStorybook?.character_name || 'your child'}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 pb-4">
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
                    <Button variant="outline" className="w-full" onClick={() => setResumeStorybook(null)}>
                      Close
                    </Button>
                  </div>
                ) : (resumeStorybook.status === 'generating' || resumeStorybook.status === 'pending') ? (
                  // Show progress for full story generation
                  (() => {
                    const genTotalScenes = resumeStorybook.total_scenes || 10
                    const genScenesDone = resumeStorybook.scenes?.length || 0
                    const genProgress = Math.min(Math.round((genScenesDone / genTotalScenes) * 100), 100)
                    // Use thumbnail/first_scene_image from list API (these have proper proxy URLs)
                    // Raw scene image_urls from the list endpoint may not be accessible
                    const displayImageUrl = resumeStorybook.first_scene_image || resumeStorybook.thumbnail_url || resumeStorybook.first_scene_base_image
                    return (
                      <div className="space-y-4">
                        {displayImageUrl && (
                          <div className="rounded-xl overflow-hidden bg-black relative" style={{ minHeight: '280px' }}>
                            <img
                              src={displayImageUrl}
                              alt={`${resumeStorybook.title}`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 pt-3 pb-6 z-10">
                              <div className="flex items-center justify-between gap-2">
                                <h2 className="text-white text-sm font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex-1 truncate">
                                  {resumeStorybook.title}
                                </h2>
                                <div className="text-white text-[10px] font-medium shrink-0 bg-primary px-2 py-0.5 rounded-full">
                                  {genScenesDone} / {genTotalScenes} scenes
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Progress value={genProgress} className="w-full h-2" />
                          <p className="text-sm text-center text-muted-foreground">
                            {genScenesDone < genTotalScenes
                              ? `Generating scene ${genScenesDone + 1} of ${genTotalScenes}...`
                              : 'Finishing up...'}
                          </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setResumeStorybook(null)}>
                          Close
                        </Button>
                      </div>
                    )
                  })()
                ) : (
                  // Show preview and payment options when ready
                  <>
                    {/* Inline scene-style preview */}
                    {(resumeStorybook.scenes?.[0]?.image_url || resumeStorybook.thumbnail_url || resumeStorybook.first_scene_base_image) ? (
                      <div className="rounded-xl overflow-hidden bg-black relative" style={{ minHeight: '280px' }}>
                        <img
                          src={resumeStorybook.scenes?.[0]?.image_url || resumeStorybook.thumbnail_url || resumeStorybook.first_scene_base_image || "/placeholder.svg"}
                          alt={`${resumeStorybook.title} preview`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-3 pt-3 pb-6 z-10">
                          <div className="flex items-center justify-between gap-2">
                            <h2 className="text-white text-sm font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex-1 truncate">
                              {resumeStorybook.title}
                            </h2>
                            <div className="text-white text-[10px] font-medium shrink-0 bg-amber-600 px-2 py-0.5 rounded-full">
                              Preview
                            </div>
                          </div>
                        </div>
                        {resumeStorybook.scenes?.[0]?.text && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pt-8 pb-3 z-10">
                            <div className="text-center">
                              {resumeStorybook.scenes[0].text.split('\n\n').slice(0, 1).map((stanza: string, i: number) => (
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
                    {subscriptionPlans.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <LogoSpinner size={48} />
                      </div>
                    ) : (
                      <CompactPricing
                        plans={subscriptionPlans}
                        selectedPlanId={selectedPlanId}
                        onPlanSelect={setSelectedPlanId}
                        onPurchase={handleResumePurchase}
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
                        onCancel={handleResumeMaybeLater}
                      />
                    )}

                    {paymentError && (
                      <div className="p-2 bg-destructive/10 border border-destructive rounded-lg">
                        <p className="text-xs text-destructive">{paymentError}</p>
                      </div>
                    )}
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
                    className="flex-1 font-mono text-sm select-none pointer-events-none"
                    tabIndex={-1}
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
