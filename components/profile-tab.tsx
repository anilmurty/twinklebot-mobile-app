"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, CreditCard, Bell, LogOut, Crown, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useProfile } from "@/lib/queries"

interface Profile {
  full_name?: string
  email?: string
  subscription_plan?: string
  stories_per_month?: number
  custom_stories_per_month?: number
  stories_generated_this_month?: number
  characters_count?: number
  stories_generated_total?: number
  effective_stories_per_month?: number
  remaining_stories_this_month?: number
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

  const planName = profile?.subscription_plan === 'free' ? 'Free Plan' : 
                   profile?.subscription_plan === 'premium' ? 'Premium Plan' : 
                   'Free Plan'
  
  const effectiveLimit = profile?.effective_stories_per_month || profile?.stories_per_month || 1
  const remaining = profile?.remaining_stories_this_month || 0
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
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</h1>
                  <p className="text-sm md:text-base text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                    {user?.email || profile?.email || 'No email'}
                  </p>
                </div>
              </div>

              <Card className="p-4 md:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h3 className="font-bold text-base md:text-lg lg:text-xl">{planName}</h3>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{effectiveLimit} stories per month</p>
                  </div>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Upgrade
                  </Button>
                </div>
              </Card>
            </div>

        <div className="space-y-3 md:space-y-4">
          <h2 className="font-semibold text-sm md:text-base text-muted-foreground uppercase tracking-wide">Account</h2>

          <Card className="divide-y">
            <button className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Billing & Plans</p>
                  <p className="text-xs text-muted-foreground">Manage subscription</p>
                </div>
              </div>
              <Badge variant="secondary">Free</Badge>
            </button>

            <button className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Bell className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">Push notifications</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-accent">
                On
              </Badge>
            </button>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Usage</h2>

          <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Stories Generated</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{profile?.stories_generated_total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Characters Created</span>
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">{profile?.characters_count || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base font-medium">Remaining This Month</span>
              <span className="text-2xl font-bold text-accent-foreground">{remaining}/{effectiveLimit}</span>
            </div>
          </Card>
        </div>

        <div className="space-y-3 pt-4">
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg">
            Privacy Policy
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg">
            Terms of Service
          </Button>
          <Button variant="outline" className="w-full justify-start text-muted-foreground bg-transparent" size="lg">
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
