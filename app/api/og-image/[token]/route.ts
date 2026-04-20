import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * GET /api/og-image/:token
 * Returns a 1200x630 OG card composed from the storybook's first scene image.
 * We render via ImageResponse so crawlers (Facebook in particular) get a
 * landscape 1.91:1 PNG in the exact aspect ratio they expect — proxying the
 * raw scene image (often portrait) triggered "invalid format" rejections.
 *
 * Public endpoint — no auth required. The token is the share_token.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = 'then' in params ? await params : params

    const { data: storybook, error } = await supabaseAdmin
      .from('storybooks')
      .select('scenes, title, character:characters(name)')
      .eq('share_token', token)
      .eq('status', 'completed')
      .single()

    if (error || !storybook?.scenes?.length) {
      return new Response(null, { status: 404 })
    }

    const sortedScenes = [...storybook.scenes].sort(
      (a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0)
    )
    const firstScene = sortedScenes[0] as any
    if (!firstScene?.image_url) {
      return new Response(null, { status: 404 })
    }

    const urlStr = firstScene.image_url.split('?')[0]
    const urlMatch = urlStr.match(/storybook-scenes\/(.+)$/)
    if (!urlMatch) {
      return new Response(null, { status: 404 })
    }

    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('storybook-scenes')
      .createSignedUrl(urlMatch[1], 60)

    if (signError || !signedData?.signedUrl) {
      console.error('[OG-IMAGE] Failed to create signed URL:', signError)
      return new Response(null, { status: 500 })
    }

    const title = storybook.title || 'Personalized Storybook'
    const characterName = (storybook.character as any)?.name || ''

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            position: 'relative',
            backgroundColor: '#0b0b14',
          }}
        >
          <img
            src={signedData.signedUrl}
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1200px',
              height: '630px',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '260px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 80%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '40px 56px',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: 8 }}>
              {title}
            </div>
            {characterName && (
              <div style={{ fontSize: 32, opacity: 0.85 }}>
                starring {characterName}
              </div>
            )}
            <div style={{ fontSize: 24, opacity: 0.7, marginTop: 14 }}>Twinklebot</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    )
  } catch (err) {
    console.error('[OG-IMAGE] Error:', err)
    return new Response(null, { status: 500 })
  }
}
