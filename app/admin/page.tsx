"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Loader2, Plus, Minus, Trash2, UserPlus, RefreshCw, LogOut } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  premium_credits: number
  basic_credits: number
  story_credits: number
  total_credits: number
  storybook_count: number
  completed_count: number
  character_count: number
  payment_override: boolean
  created_at: string
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const { createClient } = await import("@/lib/supabase/client-browser")
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`/api/v1/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Error ${res.status}`)
  }

  return res.json()
}

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [creating, setCreating] = useState(false)

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Credit adjustment loading
  const [adjustingCredits, setAdjustingCredits] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminFetch("/users")
      setUsers(data.users)
      setForbidden(false)
    } catch (err: any) {
      if (err.message === "Forbidden") {
        setForbidden(true)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers()
    }
  }, [authLoading, user, fetchUsers])

  const handleCreateUser = async () => {
    try {
      setCreating(true)
      await adminFetch("/users/create", {
        method: "POST",
        body: JSON.stringify({ email: createEmail, password: createPassword }),
      })
      setShowCreate(false)
      setCreateEmail("")
      setCreatePassword("")
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUser) return
    try {
      setDeleting(true)
      await adminFetch(`/users/${deleteUser.id}`, { method: "DELETE" })
      setDeleteUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleAdjustCredits = async (userId: string, field: string, delta: number) => {
    try {
      setAdjustingCredits(`${userId}-${field}`)
      const result = await adminFetch(`/users/${userId}/credits`, {
        method: "PATCH",
        body: JSON.stringify({ field, delta }),
      })
      // Update locally
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        const updated = { ...u, [field]: result[field] }
        updated.total_credits = (updated.premium_credits || 0) + (updated.basic_credits || 0) + (updated.story_credits || 0)
        return updated
      }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdjustingCredits(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in.</p>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive font-semibold">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <UserPlus className="w-4 h-4 mr-1" />
              Create User
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); window.location.href = '/app' }} className="text-muted-foreground" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="p-3 bg-destructive/10 border-destructive">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-center p-3 font-medium">Credits</th>
                  <th className="text-center p-3 font-medium">Stories</th>
                  <th className="text-center p-3 font-medium">Characters</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/10">
                      <td className="p-3">
                        <div className="font-medium">{u.email}</div>
                        {u.payment_override && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">override</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={adjustingCredits === `${u.id}-premium_credits`}
                            onClick={() => handleAdjustCredits(u.id, "premium_credits", -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-mono font-bold min-w-[2ch] text-center">
                            {u.premium_credits || 0}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={adjustingCredits === `${u.id}-premium_credits`}
                            onClick={() => handleAdjustCredits(u.id, "premium_credits", 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground">premium</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono">{u.completed_count}</span>
                        <span className="text-muted-foreground">/{u.storybook_count}</span>
                        <p className="text-[10px] text-muted-foreground">done/total</p>
                      </td>
                      <td className="p-3 text-center font-mono">{u.character_count}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="p-3 border-t border-border text-xs text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </div>
          )}
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Test User</DialogTitle>
            <DialogDescription>Create a new user with email/password login</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Email"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
            <Input
              placeholder="Password (min 6 chars)"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!createEmail || createPassword.length < 6 || creating}
              onClick={handleCreateUser}
            >
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Delete User"
        description={`Delete "${deleteUser?.email}" and all their data? This cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}
