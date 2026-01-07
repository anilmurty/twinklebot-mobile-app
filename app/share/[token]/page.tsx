"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Home } from "lucide-react"

interface Scene {
  scene_number?: number
  headline?: string
  image_url?: string
  text?: string
  script_text?: string
  number?: number
  letter?: string
}

interface SharedStorybook {
  id: string
  title: string
  character_name: string
  scenes?: Scene[]
}

export default function SharedStorybookPage() {
  const params = useParams()
  const router = useRouter()
  const shareToken = params.token as string
  
  const [storybook, setStorybook] = useState<SharedStorybook | null>(null)
  const [currentScene, setCurrentScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shareToken) {
      fetchSharedStorybook()
    }
  }, [shareToken])

  const fetchSharedStorybook = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/v1/storybooks/share/${shareToken}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load shared storybook')
      }
      
      const data = await response.json()
      setStorybook(data)
    } catch (err: any) {
      console.error('Failed to fetch shared storybook:', err)
      setError(err.message || 'Failed to load shared storybook')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  const handleNext = () => {
    if (storybook?.scenes && currentScene < storybook.scenes.length - 1) {
      setCurrentScene(currentScene + 1)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !storybook) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-background">
        <p className="text-destructive mb-4 text-center">{error || 'Storybook not found'}</p>
        <Button onClick={() => router.push('/')}>
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>
    )
  }

  const scenes = storybook.scenes || []
  const scene = scenes[currentScene]

  // Format character name: first letter uppercase, rest lowercase
  const characterName = storybook.character_name 
    ? storybook.character_name.charAt(0).toUpperCase() + storybook.character_name.slice(1).toLowerCase()
    : storybook.character_name

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-semibold truncate">{storybook.title}</h1>
          {characterName && (
            <p className="text-xs md:text-sm text-muted-foreground">Starring {characterName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/')} className="shrink-0 ml-4">
          <Home className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Home</span>
        </Button>
      </div>

      {/* Story Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {scene ? (
          <>
            {/* Scene Image - Responsive Container */}
            <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 bg-muted/30 min-h-0">
              {scene.image_url ? (
                <div className="w-full h-full flex items-center justify-center max-w-4xl mx-auto">
                  <img
                    src={scene.image_url}
                    alt={scene.headline || `Scene ${scene.scene_number || currentScene + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    style={{ maxHeight: 'calc(100vh - 300px)' }}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Scene Text */}
            <div className="border-t bg-card p-4 md:p-6 shrink-0">
              <Card className="p-4 md:p-6 max-w-2xl mx-auto">
                {scene.headline && (
                  <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{scene.headline}</h2>
                )}
                <p className="text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {scene.text || scene.script_text || ''}
                </p>
              </Card>
            </div>

            {/* Navigation */}
            <div className="border-t bg-card px-4 py-3 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentScene === 0}
                className="flex-1 sm:flex-initial"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <span className="text-xs md:text-sm text-muted-foreground mx-4 text-center">
                Scene {currentScene + 1} of {scenes.length}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentScene >= scenes.length - 1}
                className="flex-1 sm:flex-initial"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No scenes available</p>
          </div>
        )}
      </div>
    </div>
  )
}

