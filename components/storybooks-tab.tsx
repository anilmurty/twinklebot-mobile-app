"use client"

import { BookOpen, Clock, CheckCircle2, Loader2, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { storybooksApi } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface Storybook {
  id: string
  title: string
  character_name: string
  status: string
  thumbnail_url?: string
  first_scene_image?: string
  created_at: string
  scenes?: any[]
  progress?: number
}

export function StorybooksTab() {
  const router = useRouter()
  const [storybooks, setStorybooks] = useState<Storybook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)

  const fetchStorybooks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await storybooksApi.list()
      setStorybooks(data.storybooks || [])
    } catch (err: any) {
      console.error('Failed to fetch storybooks:', err)
      setError(err.message || 'Failed to load storybooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorybooks()
    // Poll for updates every 5 seconds if there are generating storybooks
    const interval = setInterval(() => {
      const hasGenerating = storybooks.some(sb => sb.status === 'generating' || sb.status === 'pending')
      if (hasGenerating) {
        fetchStorybooks()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    return date.toLocaleDateString()
  }

  const handleReadStorybook = (id: string) => {
    window.location.href = `/storybook/${id}`
  }

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ id, title })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    
    try {
      await storybooksApi.delete(deleteConfirm.id)
      await fetchStorybooks() // Refresh list
    } catch (err: any) {
      alert(`Failed to delete storybook: ${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const getThumbnailOverlay = (title: string) => {
    if (title.includes('Counting')) return { text: '1-10', color: 'text-blue-600' }
    if (title.includes('Alphabet Adventure 1')) return { text: 'A-I', color: 'text-green-600' }
    if (title.includes('Alphabet Adventure 2')) return { text: 'J-R', color: 'text-purple-600' }
    if (title.includes('Alphabet Adventure 3')) return { text: 'S-Z', color: 'text-orange-600' }
    return null
  }
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/5 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">My Storybooks</h1>
          <p className="text-muted-foreground">Your personalized adventure library</p>
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
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No storybooks yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create a character and generate your first personalized storybook!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {storybooks.map((storybook) => {
              const sceneCount = storybook.scenes?.length || 0
              const progress = storybook.progress || 0
              const isGenerating = storybook.status === 'generating' || storybook.status === 'pending'
              const isCompleted = storybook.status === 'completed'
              const thumbnailUrl = storybook.thumbnail_url || storybook.first_scene_image
              const overlay = getThumbnailOverlay(storybook.title)

              return (
                <Card key={storybook.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 p-4">
                    <div className="relative shrink-0">
                      {thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnailUrl}
                            alt={storybook.title}
                            className="w-24 h-32 object-cover rounded-lg"
                          />
                          {overlay && (
                            <div className="absolute inset-0 flex items-end justify-center pointer-events-none pb-2">
                              <span className={`text-3xl font-black ${overlay.color} drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]`}>
                                {overlay.text}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-24 h-32 bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{storybook.title}</h3>
                          <p className="text-sm text-muted-foreground">Starring: {storybook.character_name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(storybook.id, storybook.title)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {sceneCount > 0 && <span>{sceneCount} scenes</span>}
                        {sceneCount > 0 && <span>•</span>}
                        <span>{formatDate(storybook.created_at)}</span>
                      </div>

                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                          <Button 
                            size="sm" 
                            className="ml-auto"
                            onClick={() => handleReadStorybook(storybook.id)}
                          >
                            Read Now
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Generating...</span>
                            {progress > 0 && <span className="font-medium">{progress}%</span>}
                          </div>
                          {progress > 0 && (
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
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
    </div>
  )
}
