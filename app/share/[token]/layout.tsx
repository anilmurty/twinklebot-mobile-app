import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase/server"
import { getSignedUrl } from "@/lib/supabase/storage"

interface Props {
  params: Promise<{ token: string }> | { token: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = "then" in params ? await params : params

  try {
    const { data: storybook } = await supabaseAdmin
      .from("storybooks")
      .select(`
        id,
        title,
        scenes,
        character:characters(name),
        template:story_templates(title)
      `)
      .eq("share_token", token)
      .eq("status", "completed")
      .single()

    if (!storybook) {
      return {
        title: "Shared Story | Twinklebot",
        description: "A personalized storybook made with Twinklebot",
      }
    }

    const characterName = (storybook.character as any)?.name || "a child"
    const storyTitle = storybook.title || (storybook.template as any)?.title || "Storybook"
    const title = `${storyTitle} starring ${characterName}`
    const description = `Read "${storyTitle}" — a personalized storybook starring ${characterName}, created with Twinklebot.`

    // Get first scene image as OG image (signed URL, 1 hour expiry — crawlers fetch immediately)
    let ogImageUrl: string | undefined
    if (storybook.scenes && Array.isArray(storybook.scenes) && storybook.scenes.length > 0) {
      const sortedScenes = [...storybook.scenes].sort(
        (a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0)
      )
      const firstScene = sortedScenes[0] as any
      if (firstScene?.image_url) {
        try {
          // Extract storage path from various URL formats:
          // - Public: .../object/public/storybook-scenes/ID/scene-1.jpg
          // - Signed: .../object/sign/storybook-scenes/ID/scene-1.jpg?token=...
          // - Simple: storybook-scenes/ID/scene-1.jpg
          const urlStr = firstScene.image_url.split('?')[0] // Strip query params (signed URL tokens)
          const urlMatch = urlStr.match(/storybook-scenes\/(.+)$/)
          if (urlMatch) {
            const path = urlMatch[1]
            console.log(`[OG] Generating signed URL for path: ${path}`)
            ogImageUrl = await getSignedUrl("storybook-scenes", path, 3600)
            console.log(`[OG] Generated OG image URL: ${ogImageUrl?.substring(0, 80)}...`)
          } else {
            console.warn(`[OG] Could not extract path from scene URL: ${firstScene.image_url.substring(0, 100)}`)
          }
        } catch (err) {
          console.error("Failed to generate OG image URL:", err)
        }
      }
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        ...(ogImageUrl && {
          images: [
            {
              url: ogImageUrl,
              width: 1024,
              height: 1024,
              alt: title,
            },
          ],
        }),
      },
      twitter: {
        card: ogImageUrl ? "summary_large_image" : "summary",
        title,
        description,
        ...(ogImageUrl && { images: [ogImageUrl] }),
      },
    }
  } catch (error) {
    console.error("Error generating share metadata:", error)
    return {
      title: "Shared Story | Twinklebot",
      description: "A personalized storybook made with Twinklebot",
    }
  }
}

export default function ShareLayout({ children }: Props) {
  return children
}
