"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Maximize, Minimize } from "lucide-react"
import { storybooksApi } from "@/lib/api-client"

interface Scene {
  scene_number?: number
  headline?: string
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
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  const toggleFullscreen = async () => {
    const container = document.getElementById('storybook-container')
    if (!container) return

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen()
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen()
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen()
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

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

  // Format character name: first letter uppercase, rest lowercase
  const characterName = storybook.character_name 
    ? storybook.character_name.charAt(0).toUpperCase() + storybook.character_name.slice(1).toLowerCase()
    : storybook.character_name

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6 lg:p-8">
      {/* Contained Frame */}
      <div 
        id="storybook-container"
        className={`mx-auto w-full max-w-4xl relative overflow-hidden rounded-lg shadow-2xl bg-black ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none h-screen' 
            : 'aspect-[9/16] md:aspect-[3/4] lg:aspect-[4/3] max-h-[90vh]'
        }`}
        style={isFullscreen ? { maxWidth: 'none' } : {}}
      >
        {scene ? (
          <>
            {/* Scene Image - Full Screen */}
            <div className="absolute inset-0">
              <img
                src={scene.image_url || "/placeholder.svg"}
                alt={`Scene ${currentScene + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Top Header with Headline */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent p-4 pb-6 z-10">
                <div className="flex items-center justify-between gap-2 md:gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/')}
                    className="text-white hover:bg-white/20 shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  {scene.headline && (
                    <h1 className="text-white text-lg md:text-xl lg:text-2xl font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center flex-1 px-2">
                      {scene.headline}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-white text-xs md:text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {currentScene + 1} / {scenes.length}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20 p-2"
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Text Overlay - Centered */}
              {(scene.text || scene.script_text) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 md:p-6 lg:p-8 pb-6 md:pb-8 lg:pb-10">
                  <div className="text-center max-w-3xl mx-auto">
                    {(scene.text || scene.script_text || '')
                      .split('\n\n')
                      .map((stanza, stanzaIdx) => (
                        <div key={stanzaIdx} className={stanzaIdx > 0 ? 'mt-3 md:mt-4' : ''}>
                          {stanza
                            .split('\n')
                            .filter(line => line.trim())
                            .map((line, lineIdx) => (
                              <p 
                                key={lineIdx} 
                                className="text-white text-base md:text-lg lg:text-xl leading-relaxed md:leading-loose font-serif drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] font-medium"
                                style={{ 
                                  textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)',
                                  letterSpacing: '0.01em'
                                }}
                              >
                                {line}
                              </p>
                            ))}
                        </div>
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
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg"
                  aria-label="Previous scene"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  disabled={currentScene === scenes.length - 1}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg"
                  aria-label="Next scene"
                >
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
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
