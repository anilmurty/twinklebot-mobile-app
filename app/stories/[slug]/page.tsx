import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getStorageUrl } from "@/lib/supabase/storage"
import { ChevronRight, Sparkles } from "lucide-react"
import { StoryPreviewViewer } from "@/components/story-preview-viewer"
import { TrackedLink } from "@/components/TrackedLink"

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — hidden on mobile to give the viewer the full viewport. */}
      <header className="hidden sm:block sticky top-0 z-50 bg-card/70 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-horizontal.svg"
                alt="Twinklebot"
                width={240}
                height={128}
                className="h-10 sm:h-12 w-auto"
                style={{ filter: "brightness(1.6) saturate(1.2)" }}
              />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                How It Works
              </Link>
              <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Features
              </Link>
              <Link href="/stories" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Stories
              </Link>
            </nav>
            <TrackedLink
              href="/app"
              trackParams={{ location: "story_detail_header", label: "Login", story_slug: slug, intent: "personalize" }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-6 py-2 rounded-md text-sm"
            >
              Login
            </TrackedLink>
          </div>
        </div>
      </header>

      <main
        className={
          isComingSoon
            ? "max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-6"
            : "max-w-3xl mx-auto sm:px-6 lg:px-8 sm:pt-4 sm:pb-6"
        }
      >
        {/* SEO: keep H1 in DOM but visually hidden — title is shown inside the viewer's cover slide. */}
        <h1 className="sr-only">{template.title}</h1>

        {isComingSoon ? (
          // Coming soon: no viewer — show cover image and signup CTA
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-muted">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={template.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                <span className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Coming soon
                </span>
              </div>
            </div>
            <ComingSoonCTA title={template.title} slug={template.slug} />
          </div>
        ) : (
          previewScenes && previewScenes.length > 0 && (
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
              storySlug={template.slug}
            />
          )
        )}

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
      <TrackedLink
        href={`/app?intent=notify&story=${slug}`}
        trackParams={{ location: "story_detail_coming_soon", label: "Sign up free", story_slug: slug, intent: "notify" }}
        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-8 h-12 text-base shadow-lg shadow-primary/30 transition-colors w-full sm:w-auto"
      >
        Sign up free
        <ChevronRight className="w-5 h-5" />
      </TrackedLink>
      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <p>✓ First personalized story free</p>
        <p>✓ No credit card</p>
        <p>✓ Email notification when this story ships</p>
      </div>
    </div>
  )
}
