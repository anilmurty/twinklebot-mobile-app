import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import ReactDOM from "react-dom"
import { ChevronRight } from "lucide-react"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getTransformedImageUrl } from "@/lib/supabase/storage"
import { StoryPreviewViewer } from "@/components/story-preview-viewer"
import { LpPageViewedTracker } from "@/components/LpPageViewedTracker"
import { StaticBeforeAfter } from "@/components/landing/StaticBeforeAfter"
import { TrackedLink } from "@/components/TrackedLink"

export const dynamic = "force-static"
export const revalidate = 3600

const VALID_VARIANTS = ["v1", "v2", "v3"] as const
type Variant = (typeof VALID_VARIANTS)[number]

const VIEWER_IMG_WIDTH = 1080
const VIEWER_IMG_QUALITY = 70

interface Props {
  params: Promise<{ variant: string; slug: string }>
}

export async function generateStaticParams() {
  return VALID_VARIANTS.flatMap((variant) => [
    { variant, slug: "inside-the-human-body" },
  ])
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

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith("/") && !path.startsWith("http")) {
    return getTransformedImageUrl("story-template-assets", path.slice(1), {
      width: VIEWER_IMG_WIDTH,
      quality: VIEWER_IMG_QUALITY,
    })
  }
  return path
}

function deriveScenes(template: any): any[] {
  if (template.mock_story_data?.scenes?.length > 0) {
    return template.mock_story_data.scenes
  }
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
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variant, slug } = await params
  const template = await getTemplate(slug)
  if (!template) return { title: "Not Found" }
  const imageUrl = getImageUrl(template.thumbnail_url)
  return {
    title: `${template.title} — Make YOUR child the hero`,
    description: template.description,
    robots: { index: false, follow: false }, // LPs are paid-traffic only
    openGraph: {
      title: `${template.title} | Twinklebot`,
      description: template.description,
      type: "article",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 800, alt: template.title }],
      }),
    },
  }
}

export default async function LpPage({ params }: Props) {
  const { variant, slug } = await params
  if (!VALID_VARIANTS.includes(variant as Variant)) notFound()
  const template = await getTemplate(slug)
  if (!template) notFound()

  const v = variant as Variant
  const coverUrl = getImageUrl(template.thumbnail_url)
  const allScenes = deriveScenes(template)
  const characterName = template.mock_story_data?.character_name || "Alex"

  if (v === "v3") {
    // Pick scenes 2, 5, 8 (1-indexed) for the triptych
    const triptychPicks = [allScenes[1], allScenes[4], allScenes[7]]
      .filter(Boolean)
      .map((s: any) => ({
        headline: s.headline,
        scene_number: s.scene_number,
        image_url: s.image_url ? getImageUrl(s.image_url) : null,
      }))
    return (
      <V3Static
        slug={slug}
        title={template.title}
        triptychScenes={triptychPicks}
      />
    )
  }

  // V1 and V2 share the viewer with feature flags.
  if (allScenes.length === 0) notFound()

  const personalizeUrl = `/app?intent=signup&source=lp_${v}_${slug}`

  if (coverUrl) {
    ReactDOM.preload(coverUrl, { as: "image", fetchPriority: "high" })
  }

  if (v === "v1") {
    return (
      <LpShell variant="v1" slug={slug}>
        <StoryPreviewViewer
          title={template.title}
          characterName={characterName}
          description={template.description}
          scenes={allScenes.map((s: any) => ({
            scene_number: s.scene_number,
            headline: s.headline,
            script_text: s.script_text,
            image_url: s.image_url ? getImageUrl(s.image_url) ?? undefined : undefined,
          }))}
          coverImageUrl={coverUrl}
          personalizeUrl={personalizeUrl}
          storySlug={slug}
          hideCoverCta
          extraEventParams={{ lp_variant: "v1" }}
        />
      </LpShell>
    )
  }

  // V2: cover + 3 scenes + wall slide
  const v2Scenes = allScenes.slice(0, 3)
  const wallBgScene = allScenes[3] // scene 4 image faded behind the wall
  const wallBgUrl = wallBgScene?.image_url ? getImageUrl(wallBgScene.image_url) : null

  return (
    <LpShell variant="v2" slug={slug}>
      <StoryPreviewViewer
        title={template.title}
        characterName={characterName}
        description={template.description}
        scenes={v2Scenes.map((s: any) => ({
          scene_number: s.scene_number,
          headline: s.headline,
          script_text: s.script_text,
          image_url: s.image_url ? getImageUrl(s.image_url) ?? undefined : undefined,
        }))}
        coverImageUrl={coverUrl}
        personalizeUrl={personalizeUrl}
        storySlug={slug}
        hideCoverCta
        wallSlide={{
          headline: "Make this YOUR child's adventure",
          subtitle: "Continue reading + put your child in every scene",
          ctaText: "Make my child the hero — Free",
          ctaHref: personalizeUrl,
          backgroundImageUrl: wallBgUrl,
        }}
        extraEventParams={{ lp_variant: "v2" }}
      />
    </LpShell>
  )
}

function LpShell({
  children,
  variant,
  slug,
}: {
  children: React.ReactNode
  variant: string
  slug: string
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LpPageViewedTracker variant={variant} storySlug={slug} />
      <main className="max-w-3xl mx-auto sm:px-6 lg:px-8 sm:pt-4 sm:pb-6">{children}</main>
    </div>
  )
}

interface TriptychScene {
  headline?: string
  scene_number: number
  image_url: string | null
}

function V3Static({
  slug,
  title,
  triptychScenes,
}: {
  slug: string
  title: string
  triptychScenes: TriptychScene[]
}) {
  const personalizeUrl = `/app?intent=signup&source=lp_v3_${slug}`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LpPageViewedTracker variant="v3" storySlug={slug} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-10">
        <div className="text-center mb-6">
          <h1
            className="text-3xl sm:text-4xl font-bold leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-primary">Your child as the hero</span>
            <br />
            <span className="text-foreground">of their own storybook</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Upload a photo. We turn them into the star of magical, personalized stories.
          </p>
        </div>

        <StaticBeforeAfter
          leftImage="/lp-alex-photo.png"
          rightImage="/lp-lungs-scene.png"
          leftAlt="Photo of Alex"
          rightAlt={`Storybook scene from ${title}`}
          caption="Sample shown with Alex. Your story features your child."
        />

        <div className="mt-6 flex flex-col items-center gap-2">
          <TrackedLink
            href={personalizeUrl}
            trackParams={{
              location: "lp_v3_primary",
              label: "Make my child the hero",
              story_slug: slug,
              intent: "signup",
              lp_variant: "v3",
            }}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/40 w-full sm:w-auto"
          >
            Make my child the hero
            <ChevronRight className="w-5 h-5" />
          </TrackedLink>
        </div>

        <V3Triptych title={title} scenes={triptychScenes} />

        <div className="mt-10 flex flex-col items-center gap-2">
          <TrackedLink
            href={personalizeUrl}
            trackParams={{
              location: "lp_v3_secondary",
              label: "Read all 10 scenes of the story",
              story_slug: slug,
              intent: "signup",
              lp_variant: "v3",
            }}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/40 w-full sm:w-auto"
          >
            Read all 10 scenes of the story
            <ChevronRight className="w-5 h-5" />
          </TrackedLink>
        </div>
      </main>
    </div>
  )
}

function V3Triptych({ title: _title, scenes }: { title: string; scenes: TriptychScene[] }) {
  if (scenes.length === 0) return null
  return (
    <section className="mt-10">
      <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        A peek inside the <span className="text-primary">10 scene</span> story
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scenes.map((scene, i) => (
          <figure key={i} className="rounded-2xl overflow-hidden border border-border/50 bg-card">
            <div className="relative aspect-square">
              {scene.image_url && (
                <Image
                  src={scene.image_url}
                  alt={scene.headline || `Scene ${scene.scene_number}`}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  loading="lazy"
                  className="object-cover"
                />
              )}
            </div>
            {scene.headline && (
              <figcaption className="px-3 py-2 text-sm text-foreground/80 text-center line-clamp-2">
                {scene.headline}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}
