"use client"

import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { charactersApi } from "@/lib/api-client"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface Character {
  id: string
  name: string
  front_photo_url: string
  created_at: string
}

export function CharactersTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await charactersApi.list()
      setCharacters(data.characters || [])
    } catch (err: any) {
      console.error('Failed to fetch characters:', err)
      setError(err.message || 'Failed to load characters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters()
    
    // Check if we should open create dialog from URL param
    const shouldCreate = searchParams.get('create') === 'true'
    if (shouldCreate) {
      setShowCreateDialog(true)
      // Remove the create param from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('create')
      router.replace(`/?tab=characters${params.toString() ? '&' + params.toString() : ''}`)
    }
  }, [searchParams])

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    
    try {
      await charactersApi.delete(deleteConfirm.id)
      await fetchCharacters() // Refresh list
    } catch (err: any) {
      alert(`Failed to delete character: ${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleCharacterCreated = async () => {
    const wasFirstCharacter = characters.length === 0
    await fetchCharacters() // Refresh list after creation
    
    // If this was the first character, navigate to story library
    if (wasFirstCharacter) {
      setTimeout(() => {
        router.push('/?tab=library')
      }, 500)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-secondary/20 to-background">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Characters</h1>
          <p className="text-muted-foreground">Your storybook heroes</p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full h-auto py-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Create New Character</span>
        </Button>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchCharacters} size="sm" className="mt-2">
              Retry
            </Button>
          </Card>
        ) : characters.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No characters yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first character to start generating storybooks!
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {characters.map((character) => (
              <Card key={character.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex gap-4 p-4">
                  <div className="relative shrink-0">
                    {character.front_photo_url ? (
                      <img
                        src={character.front_photo_url}
                        alt={character.name}
                        className="w-20 h-20 object-cover rounded-full border-4 border-primary/20"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-secondary border-4 border-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-muted-foreground">
                          {character.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-xl">{character.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(character.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(character.id, character.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {characters.length > 0 && (
          <Card className="p-4 bg-accent/50 border-accent">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Ready to create a story?</h4>
                <p className="text-xs text-muted-foreground">
                  Visit the <strong>Story Library</strong> tab to select a story template and generate your personalized
                  storybook!
                </p>
              </div>
            </div>
          </Card>
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
        title="Delete Character"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}
