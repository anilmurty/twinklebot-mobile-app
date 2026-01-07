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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{storybook.title}</h1>
          {characterName && (
            <p className="text-sm text-muted-foreground">Starring {characterName}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/')}>
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Story Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {scene ? (
          <>
            {/* Scene Image */}
            <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
              {scene.image_url ? (
                <img
                  src={scene.image_url}
                  alt={scene.headline || `Scene ${scene.scene_number || currentScene + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Scene Text */}
            <div className="border-t bg-card p-6">
              <Card className="p-6 max-w-2xl mx-auto">
                {scene.headline && (
                  <h2 className="text-2xl font-bold mb-4">{scene.headline}</h2>
                )}
                <p className="text-lg leading-relaxed whitespace-pre-line">
                  {scene.text || scene.script_text || ''}
                </p>
              </Card>
            </div>

            {/* Navigation */}
            <div className="border-t bg-card px-4 py-3 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentScene === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Scene {currentScene + 1} of {scenes.length}
              </span>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentScene >= scenes.length - 1}
              >
                Next
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

