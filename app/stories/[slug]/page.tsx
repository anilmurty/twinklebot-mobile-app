import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getStorageUrl } from "@/lib/supabase/storage"
import { getDisplayCategory, STORY_CATEGORIES, getTagline } from "@/lib/story-constants"
import { ChevronRight, Sparkles, ArrowLeft } from "lucide-react"
import { StoryPreviewViewer } from "@/components/story-preview-viewer"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

async function getTemplate(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("story_templates")
    .select(
      "id, slug, title, description, category, age_range, scene_count, thumbnail_url, script_data, mock_story_data"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error || !data) return null
  return data
}

function getThumbnailUrl(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) return null
  if (thumbnailUrl.startsWith("/") && !thumbnailUrl.startsWith("http")) {
    return getStorageUrl("story-template-assets", thumbnailUrl.slice(1))
  }
  return thumbnailUrl
}

function getSceneImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("/") && !imageUrl.startsWith("http")) {
    return getStorageUrl("story-template-assets", imageUrl.slice(1))
  }
  return imageUrl
}

function deriveScenes(template: any): any[] | null {
  // Use mock_story_data if available
  if (template.mock_story_data?.scenes?.length > 0) {
    return template.mock_story_data.scenes
  }
  // Derive from script_data
  if (template.script_data?.scenes?.length > 0) {
    const folderPrefix = template.thumbnail_url
      ? template.thumbnail_url.replace(/^\//, "").split("/")[0]
      : ""
    return template.script_data.scenes.map((scene: any) => ({
      scene_number: scene.scene_number,
      headline: scene.headline,
      script_text: scene.script_text,
      image_url: folderPrefix
        ? `/${folderPrefix}/${scene.base_photo}`
        : scene.base_photo,
    }))
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const template = await getTemplate(slug)
  if (!template) return { title: "Story Not Found" }

  const imageUrl = getThumbnailUrl(template.thumbnail_url)

  return {
    title: template.title,
    description: template.description,
    openGraph: {
      title: `${template.title} | Twinklebot`,
      description: template.description,
      type: "article",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 800, alt: template.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: template.title,
      description: template.description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const template = await getTemplate(slug)
  if (!template) notFound()

  const coverUrl = getThumbnailUrl(template.thumbnail_url)
  const scenes = template.script_data?.scenes
  const isComingSoon = !scenes || !Array.isArray(scenes) || scenes.length === 0
  const previewScenes = isComingSoon ? null : deriveScenes(template)
  const previewCharacterName = template.mock_story_data?.character_name || "Alex"
  const catId = getDisplayCategory(template.title, template.category)
  const catLabel =
    STORY_CATEGORIES.find((c) => c.id === catId)?.label || template.category
  const tagline = getTagline(template.title)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/stories" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">All Stories</span>
          </Link>
          <Link
            href="/app"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero section */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {/* Cover image */}
          <div className="w-full md:w-80 shrink-0">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={template.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
              {isComingSoon && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                  <span className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Coming soon
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {catLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                Ages {template.age_range}
              </span>
              <span className="text-xs text-muted-foreground">
                {template.scene_count} pages
              </span>
            </div>

            <h1
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {template.title}
            </h1>

            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-4">
              {tagline.verb} {tagline.subject}
            </p>

            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              {template.description}
            </p>

            {/* CTA */}
            {isComingSoon ? (
              <ComingSoonCTA title={template.title} slug={template.slug} />
            ) : (
              <Link
                href={`/app?intent=personalize&story=${template.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-12 text-base shadow-lg shadow-primary/30 transition-colors w-full sm:w-auto"
              >
                Personalize with your child
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Story Preview Viewer for complete stories */}
        {previewScenes && previewScenes.length > 0 && (
          <section className="mb-12">
            <h2
              className="text-xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Story Preview
            </h2>
            <StoryPreviewViewer
              title={template.title}
              characterName={previewCharacterName}
              description={template.description}
              scenes={previewScenes.map((s: any) => ({
                scene_number: s.scene_number,
                headline: s.headline,
                script_text: s.script_text,
                image_url: s.image_url ? getSceneImageUrl(s.image_url) : undefined,
              }))}
              coverImageUrl={coverUrl}
              personalizeUrl={`/app?intent=personalize&story=${template.slug}`}
            />

            {/* CTA after viewer */}
            <div className="mt-8 text-center">
              <Link
                href={`/app?intent=personalize&story=${template.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-12 text-base shadow-lg shadow-primary/30 transition-colors"
              >
                Personalize this story with your child
                <ChevronRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-muted-foreground mt-3">
                First personalized story free — no credit card needed
              </p>
            </div>
          </section>
        )}

        {/* Browse other stories link */}
        <div className="text-center py-8 border-t border-border">
          <Link
            href="/stories"
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            ← Browse other stories
          </Link>
        </div>
      </main>
    </div>
  )
}

function ComingSoonCTA({
  title,
  slug,
}: {
  title: string
  slug: string
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Get notified when this story is ready
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Sign up free to be the first to know when{" "}
        <span className="text-foreground font-medium">{title}</span> launches.
        While you wait, you can personalize any of our 16 ready stories with
        your child as the hero — your free first story is waiting.
      </p>
      <Link
        href={`/app?intent=notify&story=${slug}`}
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-12 text-base shadow-lg shadow-primary/30 transition-colors w-full sm:w-auto"
      >
        Sign up free
        <ChevronRight className="w-5 h-5" />
      </Link>
      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <p>✓ First personalized story free</p>
        <p>✓ No credit card</p>
        <p>✓ Email notification when this story ships</p>
      </div>
    </div>
  )
}
