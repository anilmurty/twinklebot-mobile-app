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

function groupCharactersByMonth(characters: Character[]) {
  const groups: { label: string; characters: Character[] }[] = []
  const map = new Map<string, Character[]>()

  for (const c of characters) {
    const d = new Date(c.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(c)
  }

  // Sort keys descending (newest first)
  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a))
  for (const key of sortedKeys) {
    const d = new Date(key + '-01')
    groups.push({
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      characters: map.get(key)!
    })
  }
  return groups
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

  const characterGroups = groupCharactersByMonth(characters)

  return (
    <div className="min-h-full">
      <div className="p-6 md:p-8 lg:p-10 pb-24 space-y-6 md:space-y-8">
        <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Characters</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 bg-destructive/10 border-destructive">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => refetchCharacters()} size="sm" className="mt-2">
              Retry
            </Button>
          </Card>
        ) : characters.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No characters yet</p>
            <p className="text-sm text-muted-foreground">Create your first character to start generating storybooks!</p>
          </Card>
        ) : (
          <div className="space-y-8 md:space-y-10">
            {characterGroups.map((group) => (
              <section key={group.label} className="space-y-3">
                <h2 className="font-bold text-2xl md:text-3xl px-1 text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {group.label}
                </h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
                  {group.characters.map((character) => (
                    <div key={character.id} className="flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-[280px] lg:w-[260px] snap-start group">
                      {/* Image area */}
                      <div
                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                        onClick={() =>
                          setCreateStoryForCharacter({
                            id: character.id,
                            name: character.name,
                            photoUrl: character.front_photo_url,
                          })
                        }
                      >
                        {character.front_photo_url ? (
                          <img
                            src={character.front_photo_url}
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <span className="text-5xl font-bold text-white/40">
                              {character.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Bottom gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                        {/* Desktop hover overlay */}
                        <div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCreateStoryForCharacter({
                                id: character.id,
                                name: character.name,
                                photoUrl: character.front_photo_url,
                              })
                            }}
                            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            <Sparkles className="w-4 h-4 mr-1.5 inline" />
                            Create Story
                          </button>
                        </div>
                      </div>
                      {/* Name + date below image */}
                      <div className="mt-2.5 px-1">
                        <h3 className="font-semibold text-base leading-tight truncate text-foreground">
                          {character.name}
                        </h3>
                        <p className="text-[11px] mt-0.5">
                          <span className="text-muted-foreground">Created </span>
                          <span className="text-primary">
                            {new Date(character.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                      </div>
                      {/* Mobile buttons */}
                      <div className="flex items-center gap-2 mt-2 px-1 md:hidden">
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() =>
                            setCreateStoryForCharacter({
                              id: character.id,
                              name: character.name,
                              photoUrl: character.front_photo_url,
                            })
                          }
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Create Story
                        </Button>
                        <button
                          onClick={() => handleRenameClick(character)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Rename character"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(character.id, character.name)}
                          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div
        className="fixed left-4 right-4 z-20 flex justify-center"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      >
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="h-auto py-2.5 px-5 flex items-center justify-center gap-2 rounded-full shadow-lg border-0 bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
          <span className="font-semibold text-sm">Add a Character</span>
        </Button>
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
