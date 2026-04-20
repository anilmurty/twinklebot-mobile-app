"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Loader2, Plus, Minus, Trash2, UserPlus, RefreshCw, LogOut, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  premium_credits: number
  premium_credits_granted: number
  basic_credits: number
  story_credits: number
  total_credits: number
  storybook_count: number
  completed_count: number
  consumed_credits: number
  status_breakdown: Record<string, number>
  character_count: number
  payment_override: boolean
  created_at: string
}

interface StorybookDetail {
  id: string
  title: string
  status: string
  payment_status: string | null
  error_message: string | null
  quality_tier: string | null
  style: string | null
  created_at: string
  updated_at: string
}

interface CharacterDetail {
  id: string
  name: string
  avatar_status: string
  created_at: string
}

interface UserDetails {
  storybooks: StorybookDetail[]
  characters: CharacterDetail[]
}

interface RecentFailure {
  id: string
  user_id: string
  email: string
  title: string
  status: string
  payment_status: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  is_stuck: boolean
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

  // Bulk grant dialog
  const [grantUser, setGrantUser] = useState<AdminUser | null>(null)
  const [grantAmount, setGrantAmount] = useState("1")
  const [granting, setGranting] = useState(false)

  // Row expansion + drill-down
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [detailsCache, setDetailsCache] = useState<Record<string, UserDetails>>({})
  const [detailsLoading, setDetailsLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Recent failures feed
  const [failures, setFailures] = useState<RecentFailure[]>([])
  const [failuresOpen, setFailuresOpen] = useState(false)
  const [failuresLoading, setFailuresLoading] = useState(false)

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
        const updated: AdminUser = { ...u, [field]: result[field] }
        if (result.premium_credits_granted !== undefined) {
          updated.premium_credits_granted = result.premium_credits_granted
        }
        updated.total_credits = (updated.premium_credits || 0) + (updated.basic_credits || 0) + (updated.story_credits || 0)
        return updated
      }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdjustingCredits(null)
    }
  }

  const handleBulkGrant = async () => {
    if (!grantUser) return
    const delta = parseInt(grantAmount, 10)
    if (!Number.isFinite(delta) || delta < 1) {
      setError('Grant amount must be a positive integer')
      return
    }
    try {
      setGranting(true)
      await handleAdjustCredits(grantUser.id, 'premium_credits', delta)
      setGrantUser(null)
      setGrantAmount("1")
    } finally {
      setGranting(false)
    }
  }

  const fetchUserDetails = useCallback(async (userId: string) => {
    if (detailsCache[userId]) return
    try {
      setDetailsLoading(userId)
      const data = await adminFetch(`/users/${userId}/details`)
      setDetailsCache(prev => ({ ...prev, [userId]: data }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDetailsLoading(null)
    }
  }, [detailsCache])

  const toggleExpand = (userId: string, preFilter: string | null = null) => {
    if (expandedUserId === userId && statusFilter === preFilter) {
      setExpandedUserId(null)
      setStatusFilter(null)
      return
    }
    setExpandedUserId(userId)
    setStatusFilter(preFilter)
    fetchUserDetails(userId)
  }

  const fetchFailures = useCallback(async () => {
    try {
      setFailuresLoading(true)
      const data = await adminFetch("/recent-failures")
      setFailures(data.items)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFailuresLoading(false)
    }
  }, [])

  const toggleFailures = () => {
    const next = !failuresOpen
    setFailuresOpen(next)
    if (next && failures.length === 0) fetchFailures()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statusPillClass = (status: string) => {
    if (status === 'completed') return 'bg-green-500/20 text-green-700 dark:text-green-400'
    if (status === 'failed') return 'bg-red-500/20 text-red-700 dark:text-red-400'
    if (status === 'generating') return 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
    if (status === 'preview_pending') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
    return 'bg-muted text-muted-foreground'
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
          <button
            onClick={toggleFailures}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/10 text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium">Recent Failures & Stuck Storybooks</span>
              {failures.length > 0 && (
                <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                  {failures.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {failuresLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {failuresOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>
          {failuresOpen && (
            <div className="border-t border-border overflow-x-auto">
              {failures.length === 0 && !failuresLoading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No recent failures.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="text-left p-2 font-medium">User</th>
                      <th className="text-left p-2 font-medium">Title</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Error</th>
                      <th className="text-left p-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failures.map(f => (
                      <tr key={f.id} className="border-b border-border/50">
                        <td className="p-2">{f.email}</td>
                        <td className="p-2">{f.title || <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusPillClass(f.status)}`}>
                            {f.is_stuck ? 'stuck' : f.status}
                          </span>
                        </td>
                        <td className="p-2 text-destructive max-w-md truncate" title={f.error_message || ''}>
                          {f.error_message || '—'}
                        </td>
                        <td className="p-2 text-muted-foreground whitespace-nowrap">{formatDateTime(f.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-center p-3 font-medium">Credits</th>
                  <th className="text-center p-3 font-medium">Used</th>
                  <th className="text-center p-3 font-medium">Stories</th>
                  <th className="text-center p-3 font-medium">Characters</th>
                  <th className="text-left p-3 font-medium">Joined</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <React.Fragment key={u.id}>
                    <tr className="border-b border-border hover:bg-muted/10">
                      <td className="p-3">
                        <button
                          className="flex items-center gap-1 text-left font-medium hover:text-primary"
                          onClick={() => toggleExpand(u.id)}
                        >
                          {expandedUserId === u.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {u.email}
                        </button>
                        {u.payment_override && (
                          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-4">override</span>
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
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">granted: {u.premium_credits_granted || 0}</span>
                          <button
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => { setGrantUser(u); setGrantAmount("1") }}
                          >
                            +grant
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold">{u.consumed_credits}</span>
                        <p className="text-[10px] text-muted-foreground">all-time</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono">{u.completed_count}</span>
                        <span className="text-muted-foreground">/{u.storybook_count}</span>
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {Object.entries(u.status_breakdown).map(([status, count]) => (
                            <button
                              key={status}
                              onClick={() => toggleExpand(u.id, status)}
                              className={`text-[10px] px-1.5 py-0.5 rounded hover:ring-1 hover:ring-primary cursor-pointer ${statusPillClass(status)}`}
                              title={`Show ${status} storybooks`}
                            >
                              {status}: {count}
                            </button>
                          ))}
                        </div>
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
                    {expandedUserId === u.id && (
                      <tr className="border-b border-border bg-muted/5">
                        <td colSpan={7} className="p-4">
                          {detailsLoading === u.id ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : detailsCache[u.id] ? (
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-semibold">
                                    Storybooks ({detailsCache[u.id].storybooks.length})
                                    {statusFilter && (
                                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        filtered: <span className={`px-1.5 py-0.5 rounded ${statusPillClass(statusFilter)}`}>{statusFilter}</span>
                                        <button className="ml-2 text-primary hover:underline" onClick={() => setStatusFilter(null)}>clear</button>
                                      </span>
                                    )}
                                  </h3>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border text-muted-foreground">
                                        <th className="text-left p-2 font-medium">Title</th>
                                        <th className="text-left p-2 font-medium">Status</th>
                                        <th className="text-left p-2 font-medium">Payment</th>
                                        <th className="text-left p-2 font-medium">Tier/Style</th>
                                        <th className="text-left p-2 font-medium">Error</th>
                                        <th className="text-left p-2 font-medium">Created</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailsCache[u.id].storybooks
                                        .filter(s => !statusFilter || s.status === statusFilter)
                                        .map(s => (
                                          <tr key={s.id} className="border-b border-border/50">
                                            <td className="p-2">{s.title || <span className="text-muted-foreground">—</span>}</td>
                                            <td className="p-2">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusPillClass(s.status)}`}>{s.status}</span>
                                            </td>
                                            <td className="p-2 text-muted-foreground">{s.payment_status || '—'}</td>
                                            <td className="p-2 text-muted-foreground">{[s.quality_tier, s.style].filter(Boolean).join(' / ') || '—'}</td>
                                            <td className="p-2 text-destructive max-w-md truncate" title={s.error_message || ''}>
                                              {s.error_message || '—'}
                                            </td>
                                            <td className="p-2 text-muted-foreground whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                                          </tr>
                                        ))}
                                      {detailsCache[u.id].storybooks.filter(s => !statusFilter || s.status === statusFilter).length === 0 && (
                                        <tr><td colSpan={6} className="p-3 text-center text-muted-foreground">No storybooks.</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold mb-2">Characters ({detailsCache[u.id].characters.length})</h3>
                                <div className="flex flex-wrap gap-2">
                                  {detailsCache[u.id].characters.map(c => (
                                    <span key={c.id} className="text-xs bg-muted px-2 py-1 rounded">
                                      {c.name}{' '}
                                      <span className={`text-[10px] px-1 rounded ${statusPillClass(c.avatar_status === 'ready' ? 'completed' : c.avatar_status)}`}>
                                        {c.avatar_status}
                                      </span>
                                    </span>
                                  ))}
                                  {detailsCache[u.id].characters.length === 0 && (
                                    <span className="text-xs text-muted-foreground">No characters.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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

      {/* Grant Credits Dialog */}
      <Dialog open={!!grantUser} onOpenChange={(open) => { if (!open) { setGrantUser(null); setGrantAmount("1") } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Grant Premium Credits</DialogTitle>
            <DialogDescription>
              Grant free credits to {grantUser?.email}. This increases both their balance and total-granted counter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-xs text-muted-foreground">
              Current balance: <span className="font-mono font-semibold text-foreground">{grantUser?.premium_credits ?? 0}</span>
              {" · "}
              Total granted: <span className="font-mono font-semibold text-foreground">{grantUser?.premium_credits_granted ?? 0}</span>
            </div>
            <Input
              type="number"
              min={1}
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="How many credits to grant"
              autoFocus
            />
            <Button
              onClick={handleBulkGrant}
              disabled={granting}
              className="w-full"
            >
              {granting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Grant {grantAmount || 0} credit{grantAmount === "1" ? "" : "s"}
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
