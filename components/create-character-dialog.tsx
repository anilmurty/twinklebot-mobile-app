"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { charactersApi } from "@/lib/api-client"

interface CreateCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCharacterCreated?: () => void
}

export function CreateCharacterDialog({ open, onOpenChange, onCharacterCreated }: CreateCharacterDialogProps) {
  const [name, setName] = useState("")
  const [photos, setPhotos] = useState<{ front?: File; left?: File; right?: File }>({})
  const [previews, setPreviews] = useState<{ front?: string; left?: string; right?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  }

  const handleFileSelect = (position: "front" | "left" | "right", file: File) => {
    setPhotos((prev) => ({ ...prev, [position]: file }))
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews((prev) => ({ ...prev, [position]: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = (position: "front" | "left" | "right") => {
    fileInputRefs[position].current?.click()
  }

  const handleFileInputChange = (position: "front" | "left" | "right", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(position, file)
    }
  }

  const handleRemovePhoto = (position: "front" | "left" | "right") => {
    setPhotos((prev) => {
      const newPhotos = { ...prev }
      delete newPhotos[position]
      return newPhotos
    })
    setPreviews((prev) => {
      const newPreviews = { ...prev }
      if (newPreviews[position]) {
        URL.revokeObjectURL(newPreviews[position]!)
        delete newPreviews[position]
      }
      return newPreviews
    })
    // Reset file input
    if (fileInputRefs[position].current) {
      fileInputRefs[position].current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !photos.front || !photos.left || !photos.right) {
      setError('Please provide a name and all three photos')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('front_photo', photos.front)
      formData.append('left_photo', photos.left)
      formData.append('right_photo', photos.right)

      await charactersApi.create(formData)

      // Reset form
      setName("")
      setPhotos({})
      setPreviews({})
      onOpenChange(false)
      onCharacterCreated?.()
    } catch (err: any) {
      console.error('Failed to create character:', err)
      setError(err.message || 'Failed to create character. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = name.length > 0 && photos.front && photos.left && photos.right && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Character</DialogTitle>
          <DialogDescription>Add your child's photos to create their storybook character</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="character-name">Character Name</Label>
            <Input
              id="character-name"
              placeholder="Enter name (up to 20 characters)"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">{name.length}/20 characters</p>
          </div>

          <div className="space-y-4">
            <Label>Character Photos (3 required)</Label>
            <p className="text-xs text-muted-foreground">
              Upload photos from front, left, and right angles for best results
            </p>

            <div className="space-y-3">
              {(["front", "left", "right"] as const).map((position) => (
                <Card key={position} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {previews[position] ? (
                        <img
                          src={previews[position] || "/placeholder.svg"}
                          alt={position}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">{position} View</p>
                      <p className="text-xs text-muted-foreground">
                        {photos[position] ? photos[position]!.name : "No photo yet"}
                      </p>
                    </div>

                    <input
                      ref={fileInputRefs[position]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInputChange(position, e)}
                    />

                    {photos[position] ? (
                      <Button size="sm" variant="ghost" onClick={() => handleRemovePhoto(position)}>
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handlePhotoUpload(position)}>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 bg-transparent" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Character'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
