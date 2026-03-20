import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/og-image/:token
 * Serves the first scene image for a shared storybook as an OG image.
 * This is a public endpoint — no auth required (used by social media crawlers).
 * The token is the share_token, not a user auth token.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = 'then' in params ? await params : params

    // Fetch storybook by share_token
    const { data: storybook, error } = await supabaseAdmin
      .from('storybooks')
      .select('scenes')
      .eq('share_token', token)
      .eq('status', 'completed')
      .single()

    if (error || !storybook?.scenes?.length) {
      return new NextResponse(null, { status: 404 })
    }

    // Get first scene image
    const sortedScenes = [...storybook.scenes].sort(
      (a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0)
    )
    const firstScene = sortedScenes[0] as any
    if (!firstScene?.image_url) {
      return new NextResponse(null, { status: 404 })
    }

    // Extract storage path and create signed URL
    const urlStr = firstScene.image_url.split('?')[0]
    const urlMatch = urlStr.match(/storybook-scenes\/(.+)$/)
    if (!urlMatch) {
      return new NextResponse(null, { status: 404 })
    }

    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('storybook-scenes')
      .createSignedUrl(urlMatch[1], 60)

    if (signError || !signedData?.signedUrl) {
      console.error('[OG-IMAGE] Failed to create signed URL:', signError)
      return new NextResponse(null, { status: 500 })
    }

    // Fetch the actual image from Supabase storage
    const imageResponse = await fetch(signedData.signedUrl)
    if (!imageResponse.ok) {
      return new NextResponse(null, { status: 502 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    console.error('[OG-IMAGE] Error:', err)
    return new NextResponse(null, { status: 500 })
  }
}
