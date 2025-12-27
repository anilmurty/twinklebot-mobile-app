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
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 1.4 * 1024 * 1024 // 1.4MB per file (Vercel has 4.5MB total limit)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Photo is too large (${formatFileSize(file.size)}). Maximum size is 1.4MB. Please compress or resize your image.`)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setPhoto(file)
    setError(null) // Clear any previous errors
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !photo) {
      setError('Please provide a name and a photo')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('front_photo', photo)

      await charactersApi.create(formData)

      // Reset form
      setName("")
      setPhoto(null)
      setPreview(null)
      onOpenChange(false)
      onCharacterCreated?.()
    } catch (err: any) {
      console.error('Failed to create character:', err)
      setError(err.message || 'Failed to create character. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = name.length > 0 && photo && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Character</DialogTitle>
          <DialogDescription>Add your child's photo to create their storybook character</DialogDescription>
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
            <Label>Character Photo</Label>
            <p className="text-xs text-muted-foreground">
              Use a clear front-facing image with good lighting and clearly visible features. Maximum 1.4MB.
            </p>

            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Character photo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-sm">Photo</p>
                  <p className="text-xs text-muted-foreground">
                    {photo 
                      ? `${photo.name} (${formatFileSize(photo.size)})`
                      : "No photo yet"}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {photo ? (
                  <Button size="sm" variant="ghost" onClick={handleRemovePhoto}>
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handlePhotoUpload}>
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                )}
              </div>
            </Card>
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
