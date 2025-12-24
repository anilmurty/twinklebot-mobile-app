"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Mail, CreditCard, Bell, LogOut, Crown } from "lucide-react"

export function ProfileTab() {
  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">John Smith</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                john.smith@email.com
              </p>
            </div>
          </div>

          <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Free Plan</h3>
                </div>
                <p className="text-xs text-muted-foreground">3 stories per month</p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Upgrade
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Account</h2>

          <Card className="divide-y">
            <button className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
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

            <button className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
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

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Stories Generated</span>
              <span className="text-2xl font-bold text-primary">4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Characters Created</span>
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Remaining This Month</span>
              <span className="text-2xl font-bold text-accent-foreground">2/3</span>
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
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
