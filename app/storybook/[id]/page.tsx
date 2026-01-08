"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
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
  template?: {
    id: number
    title: string
  }
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

  // Check if this is the counting story
  const isCountingStory = storybook?.template?.title?.includes('Learning to Count') || 
                          storybook?.template?.title?.includes('Counting') ||
                          storybook?.title?.includes('Learning to Count') ||
                          storybook?.title?.includes('Counting')

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
  // Only highlights the number word that matches the current scene number
  const highlightNumbers = (text: string, sceneNumber: number): React.ReactNode => {
    if (!isCountingStory) return text

    const numberWords: { [key: string]: string } = {
      'One': '1',
      'Two': '2',
      'Three': '3',
      'Four': '4',
      'Five': '5',
      'Six': '6',
      'Seven': '7',
      'Eight': '8',
      'Nine': '9',
      'Ten': '10',
    }

    // Find the number word that matches the current scene number
    const targetNumericValue = sceneNumber.toString()
    const targetNumberWord = Object.keys(numberWords).find(
      key => numberWords[key] === targetNumericValue
    )

    if (!targetNumberWord) return text

    const color = numberColors[sceneNumber - 1] || numberColors[0]
    
    // Split text by the target number word only and highlight it
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    // Case-insensitive regex for the target number word only
    const regex = new RegExp(`\\b(${targetNumberWord})\\b`, 'gi')
    
    let match
    let keyCounter = 0
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      // Add highlighted number (only the target number word)
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
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    
    return parts.length > 0 ? <>{parts}</> : text
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

  // Format character name: first letter uppercase, rest lowercase
  const characterName = storybook.character_name 
    ? storybook.character_name.charAt(0).toUpperCase() + storybook.character_name.slice(1).toLowerCase()
    : storybook.character_name

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6 lg:p-8">
      {/* Contained Frame */}
      <div 
        id="storybook-container"
        className="mx-auto w-full max-w-4xl relative rounded-lg shadow-2xl bg-black overflow-visible"
      >
        {scene ? (
          <>
            {/* Scene Image - Preserve aspect ratio, show full image without cropping */}
            <div className="relative w-full flex items-center justify-center min-h-0">
              <img
                src={scene.image_url || "/placeholder.svg"}
                alt={`Scene ${currentScene + 1}`}
                className="w-full h-auto object-contain max-h-[90vh]"
                style={{ display: 'block', maxWidth: '100%' }}
              />
              
              {/* Overlay Container - positioned relative to image */}
              <div className="absolute inset-0 pointer-events-none">
              {/* Top Header with Headline */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent p-4 pb-6 z-10 pointer-events-auto">
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
                      {highlightNumbers(scene.headline, scene.scene_number || currentScene + 1)}
                    </h1>
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
                  className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg pointer-events-auto"
                  aria-label="Previous scene"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  disabled={currentScene === scenes.length - 1}
                  className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg pointer-events-auto"
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
