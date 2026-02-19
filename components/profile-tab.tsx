"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Mail, LogOut, Sparkles, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useProfile } from "@/lib/queries"
import { navigateToUrl } from "@/lib/utils/navigation"

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
      router.push('/')
    } catch (err: any) {
      console.error('Sign out error:', err)
      alert(`Sign out failed: ${err.message}`)
    }
  }

  const storyCredits = profile?.story_credits || 0
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
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  <User className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                  </h1>
                  {profile?.full_name && (
                    <p className="text-sm md:text-base text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 md:w-4 md:h-4" />
                      {user?.email?.split('@')[0] || 'User'}
                    </p>
                  )}
                  <p className="text-sm md:text-base text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                    {user?.email || profile?.email || 'No email'}
                  </p>
                </div>
              </div>

              {storyCredits > 0 && (
                <Card className="p-4 md:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        <h3 className="font-bold text-base md:text-lg lg:text-xl">Story Credits</h3>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">Available to use on any storybook</p>
                    </div>
                    <span className="text-3xl md:text-4xl font-bold text-primary">{storyCredits}</span>
                  </div>
                </Card>
              )}
            </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Library</h2>

          <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Storybooks Created</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{profile?.stories_generated_total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Storybooks Purchased</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{profile?.storybooks_purchased || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Storybook Balance</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{storyCredits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Characters Created</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{profile?.characters_count || 0}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-4">
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => navigateToUrl('https://www.twinklebot.app/privacy')}>
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => navigateToUrl('https://www.twinklebot.app/terms')}>
            Terms of Service
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg" onClick={() => navigateToUrl('https://www.twinklebot.app/help')}>
            Help & Support
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 bg-transparent"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
          </>
        )}
      </div>
    </div>
  )
}
