"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, LogOut, Loader2, RotateCcw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useProfile } from "@/lib/queries"
import { navigateToUrl } from "@/lib/utils/navigation"
import { isNativeApp } from "@/lib/utils/platform"
import { restorePurchases } from "@/lib/services/iap-service"

interface Profile {
  full_name?: string
  email?: string
  characters_count?: number
  stories_generated_total?: number
  storybooks_purchased?: number
  story_credits?: number
}

export function ProfileTab() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Use TanStack Query for data fetching with automatic caching
  const {
    data: profile,
    isLoading: loading,
    error: profileError,
    refetch: refetchProfile
  } = useProfile()

  const error = profileError?.message || null

  const handleSignOut = async () => {
    try {
      await signOut()
      if (isNativeApp()) {
        router.push('/app')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Sign out error:', err)
      alert(`Sign out failed: ${err.message}`)
    }
  }

  const [showRestore, setShowRestore] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    setShowRestore(isNativeApp())
  }, [])

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true)
      await restorePurchases()
      await refetchProfile()
      alert('Purchases restored successfully!')
    } catch (err: any) {
      console.error('Restore purchases error:', err)
      alert(`Failed to restore purchases: ${err.message}`)
    } finally {
      setIsRestoring(false)
    }
  }

  const storyCredits = profile?.story_credits || 0
  const avatarUrl = (user as any)?.user_metadata?.avatar_url || (user as any)?.user_metadata?.picture
  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 to-background">
      <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => refetchProfile()} size="sm" className="mt-2">
              Retry
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-4 md:gap-6">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile?.full_name || 'Profile'}
                    className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-4 border-primary/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                      {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold truncate">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign Out
                    </Button>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                    {user?.email || profile?.email || 'No email'}
                  </p>
                </div>
              </div>
            </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Usage</h2>

          <Card className="p-4 md:p-6 space-y-1">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm md:text-base font-medium">Current Storybook Balance</span>
                <p className="text-xs text-muted-foreground">This is how many storybooks you can create</p>
              </div>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary ml-4">{storyCredits}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm md:text-base font-medium">Storybooks Purchased</span>
                <p className="text-xs text-muted-foreground">This is how many storybooks you have purchased in total</p>
              </div>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary ml-4">{profile?.storybooks_purchased || 0}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-4">
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => router.push('/privacy')}>
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => router.push('/terms')}>
            Terms of Service
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => navigateToUrl('https://www.twinklebot.app/help')}>
            Help & Support
          </Button>
        </div>

        {showRestore && (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground bg-transparent"
            size="lg"
            onClick={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Purchases
              </>
            )}
          </Button>
        )}
          </>
        )}
      </div>
    </div>
  )
}
