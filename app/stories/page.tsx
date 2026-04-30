import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getStorageUrl } from "@/lib/supabase/storage"
import { STORY_CATEGORIES, getDisplayCategory } from "@/lib/story-constants"

// This page fetches from DB at request time — cannot be statically rendered
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Free Story Library",
  description:
    "50+ educational stories for kids. Read instantly, no account needed. Personalize your favorites with your child as the hero.",
  openGraph: {
    title: "Free Story Library | Twinklebot",
    description:
      "50+ educational stories for kids. Read instantly, no account needed.",
    type: "website",
  },
}

interface Template {
  id: number
  slug: string
  title: string
  description: string
  category: string
  age_range: string
  scene_count: number
  thumbnail_url: string | null
  script_data: any
}

function getThumbnailUrl(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) return null
  if (thumbnailUrl.startsWith("/") && !thumbnailUrl.startsWith("http")) {
    return getStorageUrl("story-template-assets", thumbnailUrl.slice(1))
  }
  return thumbnailUrl
}

function isComplete(template: Template): boolean {
  const scenes = template.script_data?.scenes
  return scenes && Array.isArray(scenes) && scenes.length > 0
}

export default async function StoriesPage() {
  const { data: templates } = await supabaseAdmin
    .from("story_templates")
    .select(
      "id, slug, title, description, category, age_range, scene_count, thumbnail_url, script_data"
    )
    .eq("is_active", true)
    .order("title")

  if (!templates) return null

  // Group by display category, complete stories first
  const grouped: Record<string, Template[]> = {}
  for (const cat of STORY_CATEGORIES) {
    grouped[cat.id] = []
  }
  for (const t of templates as Template[]) {
    const catId = getDisplayCategory(t.title, t.category)
    if (grouped[catId]) {
      grouped[catId].push(t)
    }
  }
  for (const cat of STORY_CATEGORIES) {
    grouped[cat.id].sort((a, b) => {
      const aComplete = isComplete(a) ? 0 : 1
      const bComplete = isComplete(b) ? 0 : 1
      return aComplete - bComplete
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/70 backdrop-blur-md border-b border-border">
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
              <Link href="/stories" className="text-foreground font-medium">
                Stories
              </Link>
              <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Pricing
              </Link>
            </nav>
            <Link
              href="/app"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 px-6 py-2 rounded-md text-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page heading */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Free Story Library
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            50+ educational stories. Read instantly, no account needed.
            Personalize your favorites with your child as the hero.
          </p>
        </div>

        {/* Genre sections */}
        {STORY_CATEGORIES.map((cat) => {
          const stories = grouped[cat.id]
          if (!stories || stories.length === 0) return null
          return (
            <section key={cat.id} className="mb-14">
              <h2
                className="text-2xl font-bold text-foreground mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {cat.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {stories.map((t) => {
                  const imgUrl = getThumbnailUrl(t.thumbnail_url)
                  const complete = isComplete(t)
                  return (
                    <Link
                      key={t.id}
                      href={`/stories/${t.slug}`}
                      className="group block rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all hover:scale-[1.02]"
                    >
                      <div className="relative aspect-square">
                        {imgUrl ? (
                          <Image
                            src={imgUrl}
                            alt={t.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              No image
                            </span>
                          </div>
                        )}
                        {!complete && (
                          <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-yellow-500/90 text-yellow-950 px-2 py-0.5 rounded-full">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {t.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {t.age_range}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            &copy; {new Date().getFullYear()} Twinklebot. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
