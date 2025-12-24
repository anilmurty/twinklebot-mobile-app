"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X } from "lucide-react"
import { Card } from "@/components/ui/card"

interface CreateCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCharacterDialog({ open, onOpenChange }: CreateCharacterDialogProps) {
  const [name, setName] = useState("")
  const [photos, setPhotos] = useState<{ front?: string; left?: string; right?: string }>({})

  const handlePhotoUpload = (position: "front" | "left" | "right") => {
    // Simulate photo upload - in real app would open file picker or camera
    setPhotos((prev) => ({
      ...prev,
      [position]: `/placeholder.svg?height=200&width=200&query=${position} facing child photo`,
    }))
  }

  const handleRemovePhoto = (position: "front" | "left" | "right") => {
    setPhotos((prev) => {
      const newPhotos = { ...prev }
      delete newPhotos[position]
      return newPhotos
    })
  }

  const canSubmit = name.length > 0 && photos.front && photos.left && photos.right

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
                      {photos[position] ? (
                        <img
                          src={photos[position] || "/placeholder.svg"}
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
                        {photos[position] ? "Photo added" : "No photo yet"}
                      </p>
                    </div>

                    {photos[position] ? (
                      <Button size="sm" variant="ghost" onClick={() => handleRemovePhoto(position)}>
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handlePhotoUpload(position)}>
                          <Camera className="w-3 h-3 mr-1" />
                          Take
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePhotoUpload(position)}>
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!canSubmit}
              onClick={() => {
                // Handle character creation
                onOpenChange(false)
                setName("")
                setPhotos({})
              }}
            >
              Create Character
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
