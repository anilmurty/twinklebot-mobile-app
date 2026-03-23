"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { charactersApi } from "@/lib/api-client"

interface CreateCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCharacterCreated?: () => void
}

export function CreateCharacterDialog({ open, onOpenChange, onCharacterCreated }: CreateCharacterDialogProps) {
  const [name, setName] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "">("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoLibraryInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Photo is too large (${formatFileSize(file.size)}). Maximum size is 10MB. Please compress or resize your image.`)
      // Reset the file inputs
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ''
      }
      if (photoLibraryInputRef.current) {
        photoLibraryInputRef.current.value = ''
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
    
    // Reset both inputs
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (photoLibraryInputRef.current) {
      photoLibraryInputRef.current.value = ''
    }
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handlePhotoLibraryClick = () => {
    photoLibraryInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    setPhoto(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    // Reset file inputs
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (photoLibraryInputRef.current) {
      photoLibraryInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!name.trim() || !photo || !gender) {
      setError('Please provide a name, gender, and a photo')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Upload photo directly to Supabase Storage from client
      // This bypasses Vercel's 4.5MB request body limit
      const { createClient } = await import('@/lib/supabase/client-browser')
      const supabase = createClient()
      
      if (!supabase) {
        throw new Error('Supabase client not available. Please check your configuration.')
      }
      
      // Get current user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!currentUser) {
        throw new Error('You must be logged in to create a character')
      }

      // Generate a temporary ID for the upload path
      // Use crypto.randomUUID() if available, otherwise generate a simple random ID
      const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      const tempPath = `${currentUser.id}/temp/${tempId}.jpg`

      // Upload to temporary location
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-photos')
        .upload(tempPath, photo, {
          contentType: photo.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        // Try to parse error message if it's JSON
        let errorMessage = uploadError.message
        try {
          if (typeof uploadError === 'string' && uploadError.includes('{')) {
            const parsed = JSON.parse(uploadError)
            errorMessage = parsed.error || parsed.message || uploadError.message
          }
        } catch {
          // Not JSON, use original message
        }
        throw new Error(`Failed to upload photo: ${errorMessage}`)
      }

      // Get the public URL (we'll move it to final location on server)
      const { data: urlData } = supabase.storage
        .from('character-photos')
        .getPublicUrl(uploadData.path)

      // Send character name, gender, and temp photo path to API
      // API will create character, move file to final location, and update character
      await charactersApi.create({
        name: name.trim(),
        gender: gender as "male" | "female",
        photo_path: uploadData.path, // Send the storage path, not the URL
      })

      // Reset form
      setName("")
      setGender("")
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

  const canSubmit = name.length > 0 && gender && photo && !isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(28rem,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label>Gender <span className="text-destructive">*</span></Label>
            <RadioGroup 
              value={gender} 
              onValueChange={(value) => setGender(value as "male" | "female" | "")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male" className="cursor-pointer font-normal">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female" className="cursor-pointer font-normal">Female</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Character Photo</Label>
            <p className="text-xs text-muted-foreground">
              Use a clear front-facing image with good lighting and clearly visible features. Maximum 10MB.
            </p>

            <Card className="p-4">
              {preview ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                    <img
                      src={preview}
                      alt="Character photo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{photo?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {photo ? formatFileSize(photo.size) : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleRemovePhoto}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <input
                    ref={photoLibraryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCameraClick}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handlePhotoLibraryClick}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Photo Library
                  </Button>
                </div>
              )}
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
