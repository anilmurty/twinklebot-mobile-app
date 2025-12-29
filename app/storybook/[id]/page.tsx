"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { storybooksApi } from "@/lib/api-client"

interface Scene {
  scene_number?: number
  image_url?: string
  text?: string
  script_text?: string // Fallback for old format
  number?: number
  letter?: string
  generated_at?: string
}

interface Storybook {
  id: string
  title: string
  character_name: string
  status: string
  scenes?: Scene[]
}

export default function StorybookViewerPage() {
  const params = useParams()
  const router = useRouter()
  const storybookId = params.id as string
  
  const [storybook, setStorybook] = useState<Storybook | null>(null)
  const [currentScene, setCurrentScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (storybookId) {
      fetchStorybook()
    }
  }, [storybookId])

  const fetchStorybook = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await storybooksApi.get(storybookId)
      setStorybook(data)
    } catch (err: any) {
      console.error('Failed to fetch storybook:', err)
      setError(err.message || 'Failed to load storybook')
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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !storybook) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6">
        <p className="text-destructive mb-4">{error || 'Storybook not found'}</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    )
  }

  const scenes = storybook.scenes || []
  const scene = scenes[currentScene]

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{storybook.title}</h1>
            <p className="text-xs text-muted-foreground">Starring: {storybook.character_name}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentScene + 1} / {scenes.length}
          </div>
        </div>
      </div>

      {/* Scene Content - Full Screen */}
      <div className="flex-1 relative overflow-hidden">
        {scene ? (
          <>
            {/* Scene Image - Full Screen */}
            <div className="absolute inset-0">
              <img
                src={scene.image_url || "/placeholder.svg"}
                alt={`Scene ${currentScene + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Text Overlay */}
              {(scene.text || scene.script_text) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pb-8">
                  <div className="space-y-1">
                    {(scene.text || scene.script_text || '')
                      .split('\n')
                      .filter(line => line.trim())
                      .map((line, idx) => (
                        <p key={idx} className="text-white text-lg leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          {line}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Arrows */}
            {scenes.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={handlePrevious}
                  disabled={currentScene === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                  aria-label="Previous scene"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  disabled={currentScene === scenes.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
                  aria-label="Next scene"
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No scenes available</p>
          </div>
        )}
      </div>
    </div>
  )
}

