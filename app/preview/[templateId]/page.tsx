"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { templatesApi } from "@/lib/api-client"

interface MockScene {
  scene_number?: number
  headline?: string
  image_url?: string
  script_text?: string
  text?: string
}

interface Template {
  id: number
  title: string
  description?: string
  mock_story_data?: {
    scenes?: MockScene[]
    character_name?: string
  }
}

export default function StoryPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [currentScene, setCurrentScene] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await templatesApi.get(parseInt(templateId))
      console.log('Fetched template data:', {
        id: data.id,
        title: data.title,
        hasMockData: !!data.mock_story_data,
        sceneCount: data.mock_story_data?.scenes?.length || 0,
        firstSceneImageUrl: data.mock_story_data?.scenes?.[0]?.image_url
      })
      setTemplate(data)
      
      // Check if mock story data exists
      if (!data.mock_story_data || !data.mock_story_data.scenes || data.mock_story_data.scenes.length === 0) {
        setError("Preview not available for this story")
      }
    } catch (err: any) {
      console.error('Failed to fetch template:', err)
      setError(err.message || 'Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  // Fetch template on mount
  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  // Get current scene data (safe to use even if template is null)
  const scenes = template?.mock_story_data?.scenes || []
  const characterName = template?.mock_story_data?.character_name || "Alex"
  const scene = scenes[currentScene] || null

  // Debug: Log scene data when it changes
  useEffect(() => {
    if (scene) {
      console.log('Current scene:', {
        scene_number: scene.scene_number,
        headline: scene.headline,
        image_url: scene.image_url,
        hasImageUrl: !!scene.image_url
      })
    }
  }, [scene, currentScene])

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1)
      setImageError(false) // Reset image error when changing scenes
    }
  }

  const handlePrevious = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
      setImageError(false) // Reset image error when changing scenes
    }
  }

  // Check if this is the counting story
  const isCountingStory = template?.title?.includes('Learning to Count') || 
                          template?.title?.includes('Counting')

  // Color palette for number highlighting (different color per scene)
  const numberColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#95A5A6', // Gray
  ]

  // Function to highlight numbers in text for counting story
  const highlightNumbers = (text: string, sceneNumber: number): React.ReactNode => {
    if (!isCountingStory) return text

    const numberWords: { [key: string]: string } = {
      'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5',
      'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10',
    }

    const color = numberColors[sceneNumber - 1] || numberColors[0]
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    const targetNumericValue = sceneNumber.toString()
    const targetNumberWord = Object.keys(numberWords).find(
      (key) => numberWords[key] === targetNumericValue
    )

    if (!targetNumberWord) return text

    const regex = new RegExp(`\\b(${targetNumberWord})\\b`, 'gi')
    let match
    let keyCounter = 0
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      const numberWord = match[1]
      const numericValue = numberWords[targetNumberWord]
      parts.push(
        <span
          key={`highlight-${keyCounter++}`}
          style={{
            color,
            fontSize: '1.2em',
            fontWeight: 'bold',
            textShadow: `0 2px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)`
          }}
        >
          {numberWord} ({numericValue})
        </span>
      )
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    return parts.length > 0 ? <>{parts}</> : text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !template || !template.mock_story_data?.scenes) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Preview Not Available</h2>
          <p className="text-muted-foreground mb-4">{error || "This story doesn't have a preview yet."}</p>
          <Button onClick={() => router.push('/app?tab=library')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Story Library
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        {scene ? (
          <>
            {/* Scene Image - Preserve aspect ratio, show full image without cropping */}
            <div className="relative w-full flex items-center justify-center min-h-[60vh] bg-black">
              {imageError ? (
                <div className="flex flex-col items-center justify-center text-white p-8">
                  <p className="text-lg mb-2">Image failed to load</p>
                  <p className="text-sm text-gray-400 mb-4">URL: {scene.image_url}</p>
                  <Button onClick={() => setImageError(false)} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <img
                  src={scene.image_url || "/placeholder.svg"}
                  alt={`Scene ${currentScene + 1}`}
                  className="w-full h-auto object-contain max-h-[90vh]"
                  style={{ display: 'block', maxWidth: '100%' }}
                  onLoad={() => {
                    console.log(`✅ Image loaded successfully: ${scene.image_url}`)
                    setImageError(false)
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load image:`, {
                      url: scene.image_url,
                      scene_number: scene.scene_number,
                      headline: scene.headline
                    })
                    setImageError(true)
                  }}
                />
              )}
              
              {/* Overlay Container - positioned relative to image */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Header with Headline */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent p-4 pb-6 z-10 pointer-events-auto">
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push('/app?tab=library')}
                      className="text-white hover:bg-white/20 shrink-0"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    {scene.headline ? (
                      <h1 className="text-white text-lg md:text-xl lg:text-2xl font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center flex-1 px-2 min-w-0">
                        {highlightNumbers(scene.headline.replace(/\[Name\]/g, characterName), scene.scene_number || currentScene + 1)}
                      </h1>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="text-white text-xs md:text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
                      {currentScene + 1} / {scenes.length}
                    </div>
                  </div>
                </div>

                {/* Text Overlay - Centered */}
                {(scene.text || scene.script_text) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 md:p-6 lg:p-8 pb-6 md:pb-8 lg:pb-10">
                    <div className="text-center max-w-3xl mx-auto">
                      {(scene.text || scene.script_text || '')
                        .replace(/\[Name\]/g, characterName)
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
                                  {highlightNumbers(line, scene.scene_number || currentScene + 1)}
                                </p>
                              ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            {scenes.length > 1 && (
              <>
                {/* Left Arrow */}
                <button
                  onClick={handlePrevious}
                  disabled={currentScene === 0}
                  className="cursor-pointer absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg pointer-events-auto"
                  aria-label="Previous scene"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  disabled={currentScene === scenes.length - 1}
                  className="cursor-pointer absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg pointer-events-auto"
                  aria-label="Next scene"
                >
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>
              </>
            )}

            {/* Preview Badge */}
            <div className="absolute top-20 right-4 z-30 pointer-events-none">
              <div className="bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                PREVIEW
              </div>
            </div>
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

