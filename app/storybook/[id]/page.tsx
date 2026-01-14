"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Sparkles, BookOpen } from "lucide-react"
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

  // Total pages: title page (0) + scenes (1 to scenes.length) + end page (scenes.length + 1)
  const scenes = storybook?.scenes || []
  const totalPages = scenes.length + 2
  const isTitlePage = currentScene === 0
  const isEndPage = currentScene === totalPages - 1
  const sceneIndex = currentScene - 1 // Actual scene index (0-based) when viewing scenes

  const handlePrevious = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  const handleNext = () => {
    if (currentScene < totalPages - 1) {
      setCurrentScene(currentScene + 1)
    }
  }
  
  // Get story-specific intro text based on template
  const getStoryIntro = (templateTitle: string | undefined, charName: string) => {
    const title = templateTitle?.toLowerCase() || ''
    if (title.includes('counting') || title.includes('count')) {
      return `This is the story of how ${charName} counts things around the home`
    }
    if (title.includes('alphabet adventure 1')) {
      return `This is the story of how ${charName} learns the names and spellings of things around the neighborhood`
    }
    if (title.includes('alphabet adventure 2')) {
      return `This is the story of how ${charName} continues learning letters and words on an adventure`
    }
    if (title.includes('alphabet adventure 3')) {
      return `This is the story of how ${charName} completes the alphabet journey`
    }
    if (title.includes('zoo')) {
      return `This is the story of ${charName}'s fun-filled day at the zoo`
    }
    // Default fallback
    return `This is ${charName}'s personalized adventure`
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
        <Button onClick={() => router.push('/app')}>Go Home</Button>
      </div>
    )
  }

  const scene = !isTitlePage && !isEndPage ? scenes[sceneIndex] : null
  
  // Get first scene image for cover
  const coverImage = scenes[0]?.image_url || "/placeholder.svg"

  // Format character name: first letter uppercase, rest lowercase
  // Also check nested character object as fallback
  const rawCharacterName = storybook.character_name || (storybook as any).character?.name || ''
  const characterName = rawCharacterName 
    ? rawCharacterName.charAt(0).toUpperCase() + rawCharacterName.slice(1).toLowerCase()
    : 'Your Child'

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 md:p-6 lg:p-8">
      {/* Contained Frame */}
      <div 
        id="storybook-container"
        className="mx-auto w-full max-w-4xl relative rounded-lg shadow-2xl bg-black overflow-visible"
      >
        {/* Title Page */}
        {isTitlePage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-[70vh] bg-black rounded-lg overflow-hidden">
              {/* Background Image with Overlay */}
              <img
                src={coverImage}
                alt="Story Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto">
                {/* Back Button */}
                <div className="absolute top-4 left-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push('/app')}
                    className="text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>
                
                {/* Story Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-serif mb-6 drop-shadow-lg">
                  {storybook.title}
                </h1>
                
                {/* Starring */}
                <div className="flex items-center gap-2 mb-8">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-white/80 text-lg">Starring</span>
                  <span className="text-white text-xl font-bold">{characterName}</span>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                
                {/* Story Intro */}
                <p className="text-white/90 text-lg md:text-xl font-serif italic leading-relaxed mb-8 drop-shadow-md">
                  "{getStoryIntro(storybook.template?.title, characterName || 'your child')}"
                </p>
                
                {/* Page Indicator */}
                <div className="text-white/60 text-sm">
                  Tap the arrow to start reading →
                </div>
              </div>
            </div>
            
            {/* Next Arrow for Title Page */}
            <button
              onClick={handleNext}
              className="cursor-pointer absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all backdrop-blur-sm shadow-lg"
              aria-label="Start reading"
            >
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </button>
          </>
        )}
        
        {/* End Page */}
        {isEndPage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-[70vh] bg-black rounded-lg overflow-hidden">
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-black to-black" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto">
                {/* The End Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white font-serif mb-4 drop-shadow-lg">
                  The End
                </h1>
                
                <p className="text-white/70 text-lg md:text-xl mb-8 font-serif italic">
                  of {characterName}'s adventure
                </p>
                
                {/* Decorative Divider */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-px bg-white/30" />
                  <Sparkles className="w-6 h-6 text-primary" />
                  <div className="w-16 h-px bg-white/30" />
                </div>
                
                {/* CTA Section */}
                <Card className="bg-white/95 backdrop-blur-sm p-6 md:p-8 mb-6 shadow-2xl">
                  <h2 className="text-xl md:text-2xl font-bold text-amber-900 mb-3">
                    Ready for another adventure?
                  </h2>
                  <p className="text-amber-800/70 mb-6">
                    Explore more stories in our library and create new magical memories.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => router.push('/app?tab=library')}
                    className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-xl shadow-primary/30 h-14 text-lg"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Generate Your Next Story
                  </Button>
                </Card>
                
                {/* Back to Home Link */}
                <Button 
                  variant="ghost"
                  onClick={() => router.push('/app')}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to My Storybooks
                </Button>
              </div>
            </div>
            
            {/* Previous Arrow for End Page */}
            <button
              onClick={handlePrevious}
              className="cursor-pointer absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full bg-white/20 hover:bg-white/30 transition-all backdrop-blur-sm shadow-lg"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </button>
          </>
        )}
        
        {/* Scene Pages */}
        {scene && !isTitlePage && !isEndPage && (
          <>
            {/* Scene Image - Preserve aspect ratio, show full image without cropping */}
            <div className="relative w-full flex items-center justify-center min-h-0">
              <img
                src={scene.image_url || "/placeholder.svg"}
                alt={`Scene ${sceneIndex + 1}`}
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
                    onClick={() => router.push('/app')}
                    className="text-white hover:bg-white/20 shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  {scene.headline ? (
                    <h1 className="text-white text-lg md:text-xl lg:text-2xl font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center flex-1 px-2 min-w-0">
                      {highlightNumbers(scene.headline, scene.scene_number || sceneIndex + 1)}
                    </h1>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className="text-white text-xs md:text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
                    {sceneIndex + 1} / {scenes.length}
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
                                {highlightNumbers(line, scene.scene_number || sceneIndex + 1)}
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
                disabled={currentScene === totalPages - 1}
                className="cursor-pointer absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/60 hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm shadow-lg pointer-events-auto"
                aria-label="Next scene"
              >
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </button>
            </>
          </>
        )}
        
        {/* Fallback if no content */}
        {!isTitlePage && !isEndPage && !scene && (
          <div className="h-full flex items-center justify-center min-h-[50vh]">
            <p className="text-muted-foreground">No scenes available</p>
          </div>
        )}
      </div>
    </div>
  )
}
