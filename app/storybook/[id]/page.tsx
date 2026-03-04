"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Sparkles, BookOpen, X } from "lucide-react"
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

  const isAlphabetStory = storybook?.template?.title?.includes('Alphabet') ||
                          storybook?.title?.includes('Alphabet')

  // Color palette for number highlighting (different color per scene)
  const numberColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#95A5A6',
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

  // Build alphabet map from scene headlines (e.g., "A for Airplane" → { letter: 'A', object: 'Airplane' })
  const alphabetMap: { [sceneNum: number]: { letter: string; object: string } } = {}
  if (isAlphabetStory) {
    scenes.forEach((s) => {
      const match = s.headline?.match(/^([A-Z])\s+for\s+(.+)$/i)
      if (match && s.scene_number) {
        alphabetMap[s.scene_number] = { letter: match[1].toUpperCase(), object: match[2].trim() }
      }
    })
  }

  // Function to highlight alphabet letter and object in text for alphabet story
  const highlightAlphabet = (text: string, sceneNumber: number): React.ReactNode => {
    const entry = alphabetMap[sceneNumber]
    if (!entry) return text

    const color = numberColors[sceneNumber - 1] || numberColors[0]
    const { letter, object } = entry
    const escapedObject = object.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Match standalone letter OR object word (case-insensitive regex, but skip lowercase letter matches)
    const regex = new RegExp(`\\b(${letter})\\b|\\b(${escapedObject})\\b`, 'gi')
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let keyCounter = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // If this matched the single-letter pattern, only highlight if uppercase
      if (match[1] !== undefined && match[0] !== letter) {
        continue
      }
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      parts.push(
        <span
          key={`alpha-${keyCounter++}`}
          style={{
            color,
            fontSize: '1.2em',
            fontWeight: 'bold',
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {match[0]}
        </span>
      )
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? <>{parts}</> : text
  }

  // Unified highlight function for all story types
  const highlightSceneText = (text: string, sceneNumber: number): React.ReactNode => {
    if (isCountingStory) return highlightNumbers(text, sceneNumber)
    if (isAlphabetStory) return highlightAlphabet(text, sceneNumber)
    return text
  }

  // Highlight character name in text with orange color and slightly larger font
  // Handles both plain strings and React nodes (from highlightNumbers)
  const highlightCharacterName = (content: React.ReactNode): React.ReactNode => {
    if (!characterName) return content
    if (typeof content === 'string') {
      const regex = new RegExp(`(${characterName})`, 'gi')
      const parts = content.split(regex)
      if (parts.length <= 1) return content
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === characterName.toLowerCase() ? (
              <span key={i} className="text-amber-500" style={{ fontSize: '1.1em', fontWeight: 700 }}>{part}</span>
            ) : (
              part
            )
          )}
        </>
      )
    }
    // If it's a React element with children (e.g. from highlightNumbers), process children
    if (content && typeof content === 'object' && 'props' in (content as any)) {
      const element = content as React.ReactElement
      const children = (element.props as any).children
      if (Array.isArray(children)) {
        return <>{children.map((child: React.ReactNode, i: number) => {
          if (typeof child === 'string') return <span key={`cn-${i}`}>{highlightCharacterName(child)}</span>
          return child
        })}</>
      }
    }
    return content
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
    <div className="min-h-screen flex flex-col bg-black md:bg-background md:p-6 lg:p-8">
      {/* Contained Frame - full-bleed on mobile, framed on desktop */}
      <div
        id="storybook-container"
        className="mx-auto w-full max-w-4xl relative md:rounded-lg md:shadow-2xl bg-black overflow-visible"
      >
        {/* Title Page */}
        {isTitlePage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-screen md:min-h-[70vh] bg-black md:rounded-lg overflow-hidden">
              {/* Background Image with Overlay */}
              <img
                src={coverImage}
                alt="Story Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto">
                {/* Story Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-serif mb-6 drop-shadow-lg">
                  {storybook.title}
                </h1>

                {/* Starring */}
                <div className="flex items-center gap-2 mb-8">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-white/80 text-lg">Starring</span>
                  <span className="text-amber-500 text-xl font-bold">{characterName}</span>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>

                {/* Story Intro */}
                <p className="text-white/90 text-lg md:text-xl font-serif italic leading-relaxed mb-8 drop-shadow-md">
                  {getStoryIntro(storybook.template?.title, characterName || 'your child')}
                </p>

                {/* Page Indicator */}
                <div className="text-white/60 text-sm">
                  Tap the arrow to start reading →
                </div>
              </div>
            </div>

            {/* Back Arrow for Title Page */}
            <button
              onClick={() => router.push('/app')}
              className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-amber-800/80 hover:bg-amber-700/90 transition-all backdrop-blur-md shadow-lg border border-amber-700/30"
              aria-label="Go back"
            >
              <ArrowLeft className="w-7 h-7 text-white drop-shadow-lg" />
            </button>

            {/* Next Arrow for Title Page */}
            <button
              onClick={handleNext}
              className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-amber-800/80 hover:bg-amber-700/90 transition-all backdrop-blur-md shadow-lg border border-amber-700/30"
              aria-label="Start reading"
            >
              <ArrowRight className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
          </>
        )}

        {/* End Page */}
        {isEndPage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-screen md:min-h-[70vh] bg-black md:rounded-lg overflow-hidden">
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
              className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-amber-800/80 hover:bg-amber-700/90 transition-all backdrop-blur-md shadow-lg border border-amber-700/30"
              aria-label="Go back"
            >
              <ArrowLeft className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
          </>
        )}

        {/* Scene Pages */}
        {scene && !isTitlePage && !isEndPage && (
          <>
            {/* Full-screen scene container */}
            <div className="relative w-full min-h-screen bg-black">
              <img
                src={scene.image_url || "/placeholder.svg"}
                alt={`Scene ${sceneIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ display: 'block' }}
              />

              {/* Top Header with Headline */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent px-4 pt-10 pb-8 z-10">
                <div className="flex items-start justify-between gap-2">
                  {/* Close button */}
                  <button
                    onClick={() => router.push('/app')}
                    className="p-2 rounded-full bg-amber-800/70 hover:bg-amber-700/80 transition-colors backdrop-blur-sm shrink-0"
                    aria-label="Exit"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  {scene.headline ? (
                    <h1
                      className="text-yellow-300 text-xl md:text-2xl lg:text-3xl font-bold font-serif text-center flex-1 px-2 min-w-0 pt-1"
                      style={{ WebkitTextStroke: '0.5px rgba(120, 53, 15, 0.8)', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(120, 53, 15, 0.6)' }}
                    >
                      {highlightCharacterName(highlightSceneText(scene.headline, scene.scene_number || sceneIndex + 1))}
                    </h1>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className="text-white text-sm font-medium shrink-0 bg-amber-800/70 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {sceneIndex + 1}/{scenes.length}
                  </div>
                </div>
              </div>

              {/* Bottom section: story text + action button */}
              <div className="absolute bottom-0 left-0 right-0 z-10">
                {/* Text Overlay */}
                {(scene.text || scene.script_text) && (
                  <div className="bg-gradient-to-t from-black/95 via-black/85 to-transparent px-4 md:px-6 lg:px-8 pt-10 pb-2">
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
                                  {highlightCharacterName(highlightSceneText(line, scene.scene_number || sceneIndex + 1))}
                                </p>
                              ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="bg-black/90 px-4 pb-8 pt-3 flex justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push('/app?tab=library')}
                    className="text-amber-400/80 hover:text-amber-300 hover:bg-amber-900/30 text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    Browse More Stories
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Arrows - larger and more visible */}
            <>
              {/* Left Arrow */}
              <button
                onClick={handlePrevious}
                disabled={currentScene === 0}
                className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-amber-800/70 hover:bg-amber-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md shadow-lg border border-amber-700/30 pointer-events-auto"
                aria-label="Previous scene"
              >
                <ArrowLeft className="w-6 h-6 text-white drop-shadow-lg" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                disabled={currentScene === totalPages - 1}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-amber-800/70 hover:bg-amber-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md shadow-lg border border-amber-700/30 pointer-events-auto"
                aria-label="Next scene"
              >
                <ArrowRight className="w-6 h-6 text-white drop-shadow-lg" />
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
