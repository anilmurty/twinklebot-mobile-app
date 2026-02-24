"use client"

import { Plus, Trash2, Sparkles, Loader2, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { CreateStoryDialog } from "@/components/create-story-dialog"
import { charactersApi } from "@/lib/api-client"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCharacters, useDeleteCharacter, useUpdateCharacter } from "@/lib/queries"

interface Character {
  id: string
  name: string
  front_photo_url: string
  created_at: string
}

export function CharactersTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Use TanStack Query for data fetching with automatic caching
  const { 
    data: charactersData, 
    isLoading: loading, 
    error: charactersError,
    refetch: refetchCharacters 
  } = useCharacters()
  
  // Mutations
  const deleteCharacterMutation = useDeleteCharacter()
  const updateCharacterMutation = useUpdateCharacter()
  
  // Derive data from query results
  const characters = charactersData?.characters || []
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [error, setError] = useState<string | null>(charactersError?.message || null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [renameCharacter, setRenameCharacter] = useState<{ id: string; name: string } | null>(null)
  const [newName, setNewName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [createStoryForCharacter, setCreateStoryForCharacter] = useState<{
    id: string
    name: string
    photoUrl?: string
  } | null>(null)

  useEffect(() => {
    // Handle create dialog from URL parameter separately
    const shouldCreate = searchParams.get("create") === "true"
    if (shouldCreate) {
      setShowCreateDialog(true)
      // Use window.history.replaceState to avoid triggering navigation
      const params = new URLSearchParams(searchParams.toString())
      params.delete("create")
      const newUrl = `/app?tab=characters${params.toString() ? "&" + params.toString() : ""}`
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams])

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    try {
      await deleteCharacterMutation.mutateAsync(deleteConfirm.id)
      // Query cache is automatically invalidated by the mutation
    } catch (err: any) {
      alert(`Failed to delete character: ${err.message}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleRenameClick = (character: Character) => {
    setRenameCharacter({ id: character.id, name: character.name })
    setNewName(character.name)
  }

  const handleRenameConfirm = async () => {
    if (!renameCharacter || !newName.trim()) return

    // Validate name
    if (newName.length > 20 || !/^[a-zA-Z0-9]+$/.test(newName)) {
      setError("Name must be 1-20 alphanumeric characters")
      return
    }

    setIsRenaming(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', newName.trim())
      
      await updateCharacterMutation.mutateAsync({ id: renameCharacter.id, data: formData })
      // Query cache is automatically invalidated by the mutation
      setRenameCharacter(null)
      setNewName("")
    } catch (err: any) {
      setError(err.message || "Failed to rename character")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleCharacterCreated = async () => {
    const wasFirstCharacter = characters.length === 0
    await refetchCharacters() // Refresh list after creation

    // If this was the first character, navigate to story library
    if (wasFirstCharacter) {
      setTimeout(() => {
        router.push("/app?tab=library")
      }, 500)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-secondary/20 to-background">
      <div className="p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
        <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">Characters</h1>

        <div className="sticky top-0 z-10 -mx-6 px-6 pt-0 pb-3">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full h-auto py-3 flex items-center justify-center gap-2 bg-primary/85 hover:bg-primary/95 backdrop-blur-sm rounded-full shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Create New Character</span>
          </Button>
        </div>

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
            <p className="text-sm text-muted-foreground">Create your first character to start generating storybooks!</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <Card key={character.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center p-6 space-y-4">
                  <div className="relative">
                    {character.front_photo_url ? (
                      <img
                        src={character.front_photo_url || "/placeholder.svg"}
                        alt={character.name}
                        className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-full border-4 border-primary/20"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-secondary border-4 border-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {character.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-3 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="font-bold text-2xl md:text-3xl break-words">{character.name}</h3>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRenameClick(character)}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent"
                            title="Rename character"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(character.id, character.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete character"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Created{" "}
                        {new Date(character.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        setCreateStoryForCharacter({
                          id: character.id,
                          name: character.name,
                          photoUrl: character.front_photo_url,
                        })
                      }
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      title={`Create Story with ${character.name}`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Story
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateCharacterDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCharacterCreated={handleCharacterCreated}
      />

      <CreateStoryDialog
        open={!!createStoryForCharacter}
        onOpenChange={(open) => !open && setCreateStoryForCharacter(null)}
        characterId={createStoryForCharacter?.id || ""}
        characterName={createStoryForCharacter?.name || ""}
        characterPhotoUrl={createStoryForCharacter?.photoUrl}
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

      {/* Rename Character Dialog */}
      <Dialog open={!!renameCharacter} onOpenChange={(open) => {
        if (!open) {
          setRenameCharacter(null)
          setNewName("")
          setError(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Character</DialogTitle>
            <DialogDescription>
              Renaming this character will update their name in all existing storybooks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="character-name">Character Name</Label>
              <Input
                id="character-name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRenaming && newName.trim()) {
                    handleRenameConfirm()
                  }
                }}
                placeholder="Enter character name"
                maxLength={20}
                disabled={isRenaming}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                1-20 alphanumeric characters. First letter will be capitalized.
              </p>
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRenameCharacter(null)
                  setNewName("")
                  setError(null)
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameConfirm}
                disabled={isRenaming || !newName.trim() || newName.trim() === renameCharacter?.name}
              >
                {isRenaming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Rename"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
