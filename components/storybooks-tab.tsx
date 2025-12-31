"use client"

import { BookOpen, Clock, CheckCircle2, Loader2, Trash2, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { storybooksApi, charactersApi } from "@/lib/api-client"
import { useRouter, useSearchParams } from "next/navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"

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
  const searchParams = useSearchParams()
  const [storybooks, setStorybooks] = useState<Storybook[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [charactersLoading, setCharactersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchStorybooks = async () => {
    try {
      // Don't set loading to true on subsequent fetches to avoid UI flicker
      if (storybooks.length === 0) {
        setLoading(true)
      }
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

  const fetchCharacters = async () => {
    try {
      setCharactersLoading(true)
      const data = await charactersApi.list()
      setCharacters(data.characters || [])
    } catch (err: any) {
      console.error('Failed to fetch characters:', err)
    } finally {
      setCharactersLoading(false)
    }
  }

  useEffect(() => {
    fetchStorybooks()
    fetchCharacters()
  }, [])

  // Poll for updates every 3 seconds if there are generating storybooks
  useEffect(() => {
    const hasGenerating = storybooks.some(sb => sb.status === 'generating' || sb.status === 'pending')
    
    if (!hasGenerating) {
      return // Don't poll if nothing is generating
    }

    // Start polling immediately
    const interval = setInterval(() => {
      fetchStorybooks()
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [storybooks]) // Re-run when storybooks change

  // Refresh when tab becomes active (in case user navigated from story creation)
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'storybooks') {
      // Refresh immediately when navigating to this tab
      fetchStorybooks()
    }
  }, [searchParams])

  const handleCreateCharacter = () => {
    // Navigate to characters tab with create parameter
    router.push('/?tab=characters&create=true')
  }

  const handleCreateStorybook = () => {
    // Navigate to Story Library tab
    router.push('/?tab=library')
  }

  const handleCharacterCreated = () => {
    fetchCharacters() // Refresh characters list
  }

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
              const isGenerating = storybook.status === 'generating' || storybook.status === 'pending'
              const isCompleted = storybook.status === 'completed'
              const thumbnailUrl = storybook.thumbnail_url || storybook.first_scene_image
              const overlay = getThumbnailOverlay(storybook.title)

              return (
                <Card key={storybook.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 md:gap-6 p-4 md:p-6 flex-col md:flex-row w-full">
                    <div className="relative shrink-0">
                      {thumbnailUrl ? (
                        <>
                          <img
                            src={thumbnailUrl}
                            alt={storybook.title}
                            className="w-24 h-32 md:w-32 md:h-44 lg:w-40 lg:h-56 object-cover rounded-lg"
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
                        <div className="w-24 h-32 md:w-32 md:h-44 lg:w-40 lg:h-56 bg-secondary rounded-lg flex items-center justify-center">
                          <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                        </div>
                      )}
                      {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 md:space-y-3 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <h3 className="font-semibold text-lg md:text-xl lg:text-2xl truncate">{storybook.title}</h3>
                          <p className="text-sm md:text-base text-muted-foreground truncate">Starring: {storybook.character_name}</p>
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

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {sceneCount > 0 && <span>{sceneCount} scenes</span>}
                        {sceneCount > 0 && <span>•</span>}
                        <span>{formatDate(storybook.created_at)}</span>
                      </div>

                      {isCompleted ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                          <Button 
                            size="sm" 
                            className="ml-auto shrink-0"
                            onClick={() => handleReadStorybook(storybook.id)}
                          >
                            Read Now
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {progress < 100 ? (
                                // Character generation phase (10-100%)
                                progress <= 10 ? (
                                  'Starting character creation...'
                                ) : progress <= 40 ? (
                                  'Generating character 1...'
                                ) : progress <= 70 ? (
                                  'Generating character 2...'
                                ) : (
                                  'Generating character 3...'
                                )
                              ) : (
                                // Scene generation phase (110+)
                                (() => {
                                  const sceneProgress = progress - 100 // Subtract 100 to get actual scene progress (10-100%)
                                  if (sceneProgress <= 10) {
                                    return 'Starting storybook generation...'
                                  }
                                  const totalScenes = storybook.total_scenes || storybook.scenes?.length || 10
                                  // Calculate scene number: sceneProgress ranges from 10-100, map to scene 1-10
                                  const sceneNumber = Math.ceil(((sceneProgress - 10) / 90) * totalScenes)
                                  return `Scene ${sceneNumber} of ${totalScenes}...`
                                })()
                              )}
                            </span>
                            <span className="font-medium">
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
    </div>
  )
}
