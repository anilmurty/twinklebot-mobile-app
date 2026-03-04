"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, Sparkles, X } from "lucide-react"
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
  thumbnail_url?: string
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

  // Total pages: title page (0) + scenes (1 to scenes.length) + end page (scenes.length + 1)
  const totalPages = scenes.length + 2
  const isTitlePage = currentScene === 0
  const isEndPage = currentScene === totalPages - 1
  const sceneIndex = currentScene - 1 // Actual scene index (0-based) when viewing scenes
  const scene = !isTitlePage && !isEndPage ? scenes[sceneIndex] : null

  // Get cover image for title page (use first scene image or thumbnail)
  const coverImage = template?.thumbnail_url || scenes[0]?.image_url || "/placeholder.svg"

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
    if (currentScene < totalPages - 1) {
      setCurrentScene(currentScene + 1)
      setImageError(false)
    }
  }

  const handlePrevious = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
      setImageError(false)
    }
  }

  const handleGenerateStory = () => {
    router.push(`/app?tab=library&templateId=${templateId}`)
  }

  // Check if this is the counting story
  const isCountingStory = template?.title?.includes('Learning to Count') ||
                          template?.title?.includes('Counting')

  const isAlphabetStory = template?.title?.includes('Alphabet')

  // Color palette for number highlighting (different color per scene)
  const numberColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#95A5A6',
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

    // Capitalize first letter of each word
    const capitalize = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase())

    // Match: letter only when followed by " is for" or " for", OR the object word anywhere
    const letterPattern = `(${letter})(?=\\s+(?:is\\s+)?for\\b)`
    const objectPattern = `\\b(${escapedObject})\\b`
    const regex = new RegExp(`${letterPattern}|${objectPattern}`, 'gi')
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let keyCounter = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // If this matched the letter pattern, only accept uppercase
      if (match[1] !== undefined && match[1] !== letter) {
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
            fontSize: '1.4em',
            fontWeight: 'bold',
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {capitalize(match[0])}
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
        {/* Title Page */}
        {isTitlePage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-screen bg-black">
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
                    onClick={() => router.push('/app?tab=library')}
                    className="text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </div>

                {/* Preview Badge */}
                <div className="mb-6">
                  <div className="bg-yellow-500/90 text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    PREVIEW
                  </div>
                </div>

                {/* Story Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-serif mb-8 drop-shadow-lg">
                  {template?.title}
                </h1>

                {/* Info Card */}
                <Card className="bg-white/95 backdrop-blur-sm p-6 md:p-8 mb-8 shadow-2xl">
                  <p className="text-amber-900 text-base md:text-lg leading-relaxed">
                    This preview uses a model for the child. That model will be replaced with <strong>your child</strong> as a character dressed as you choose.
                  </p>
                </Card>

                {/* Generate Button */}
                <Button
                  size="lg"
                  onClick={handleGenerateStory}
                  className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-xl shadow-primary/30 px-8 h-14 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Custom Storybook
                </Button>

                {/* Page Indicator */}
                <div className="mt-8 text-white/60 text-sm">
                  Tap the arrow to start reading →
                </div>
              </div>
            </div>

            {/* Next Arrow for Title Page */}
            <button
              onClick={handleNext}
              className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/30 hover:bg-white/50 transition-all backdrop-blur-md shadow-lg border border-white/20"
              aria-label="Start reading"
            >
              <ArrowRight className="w-7 h-7 text-white drop-shadow-lg" />
            </button>
          </>
        )}

        {/* End Page */}
        {isEndPage && (
          <>
            <div className="relative w-full flex items-center justify-center min-h-screen bg-black">
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-black to-black" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto">
                {/* The End Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white font-serif mb-4 drop-shadow-lg">
                  The End
                </h1>

                <p className="text-white/70 text-lg md:text-xl mb-12 font-serif italic">
                  of {template?.title}
                </p>

                {/* Decorative Divider */}
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-16 h-px bg-white/30" />
                  <Sparkles className="w-6 h-6 text-primary" />
                  <div className="w-16 h-px bg-white/30" />
                </div>

                {/* CTA Section */}
                <Card className="bg-white/95 backdrop-blur-sm p-6 md:p-8 mb-8 shadow-2xl">
                  <h2 className="text-xl md:text-2xl font-bold text-amber-900 mb-3">
                    Make Your Child the Star!
                  </h2>
                  <p className="text-amber-800/70 mb-6">
                    Create a personalized version of this story featuring your child as the main character.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleGenerateStory}
                    className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-xl shadow-primary/30 h-14 text-lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Custom Storybook
                  </Button>
                </Card>

                {/* Back to Library Link */}
                <Button
                  variant="ghost"
                  onClick={() => router.push('/app?tab=library')}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Story Library
                </Button>
              </div>
            </div>

            {/* Previous Arrow for End Page */}
            <button
              onClick={handlePrevious}
              className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/30 hover:bg-white/50 transition-all backdrop-blur-md shadow-lg border border-white/20"
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
              {imageError ? (
                <div className="flex flex-col items-center justify-center min-h-screen text-white p-8">
                  <p className="text-lg mb-2">Image failed to load</p>
                  <p className="text-sm text-gray-400 mb-4">URL: {scene.image_url}</p>
                  <Button onClick={() => setImageError(false)} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <img
                  src={scene.image_url || "/placeholder.svg"}
                  alt={`Scene ${sceneIndex + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
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

              {/* Top Header with Headline */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent px-4 pt-10 pb-8 z-10">
                <div className="flex items-start justify-between gap-2">
                  {/* Close button */}
                  <button
                    onClick={() => router.push('/app?tab=library')}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-sm shrink-0"
                    aria-label="Exit preview"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  {scene.headline ? (
                    <h1 className="text-white text-xl md:text-2xl lg:text-3xl font-bold font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center flex-1 px-2 min-w-0 pt-1">
                      {highlightSceneText(scene.headline.replace(/\[Name\]/g, characterName), scene.scene_number || sceneIndex + 1)}
                    </h1>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-yellow-500/90 text-black px-2 py-0.5 rounded-full text-[10px] font-bold">
                      PREVIEW
                    </div>
                    <div className="text-white text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {sceneIndex + 1}/{scenes.length}
                    </div>
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
                                  {highlightSceneText(line, scene.scene_number || sceneIndex + 1)}
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
                    onClick={handleGenerateStory}
                    className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-amber-950 font-semibold shadow-lg px-6"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Custom Storybook
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
                className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/25 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md shadow-lg border border-white/20 pointer-events-auto"
                aria-label="Previous scene"
              >
                <ArrowLeft className="w-6 h-6 text-white drop-shadow-lg" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={handleNext}
                disabled={currentScene === totalPages - 1}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/25 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all backdrop-blur-md shadow-lg border border-white/20 pointer-events-auto"
                aria-label="Next scene"
              >
                <ArrowRight className="w-6 h-6 text-white drop-shadow-lg" />
              </button>
            </>
          </>
        )}

        {/* Fallback if no content */}
        {!isTitlePage && !isEndPage && !scene && (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No scenes available</p>
          </div>
        )}
      </div>
    </div>
  )
}
