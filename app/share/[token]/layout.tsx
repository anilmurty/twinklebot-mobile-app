import type { Metadata } from "next"
import { supabaseAdmin } from "@/lib/supabase/server"

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

    // Use our own OG image proxy endpoint — a clean URL that crawlers can fetch reliably.
    // The proxy fetches from private Supabase storage and serves the image directly.
    // This avoids signed URL issues (too long, expiry) and public URL issues (bucket is private).
    const ogImageUrl = `https://www.twinklebot.app/api/og-image/${token}`
    const shareUrl = `https://www.twinklebot.app/share/${token}`

    return {
      title,
      description,
      alternates: {
        canonical: shareUrl,
      },
      openGraph: {
        title,
        description,
        type: "article",
        url: shareUrl,
        siteName: "Twinklebot",
        ...(ogImageUrl && {
          images: [
            {
              url: ogImageUrl,
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
