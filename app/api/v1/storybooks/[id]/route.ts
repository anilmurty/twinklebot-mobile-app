import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

/**
 * GET /api/v1/storybooks/:id
 * Get storybook details with scenes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params
    
    const { data: storybook, error } = await supabase
      .from('storybooks')
      .select(`
        *,
        character:characters(id, name),
        template:story_templates(id, title)
      `)
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for scene images (bucket is private)
    if (storybook.scenes && Array.isArray(storybook.scenes)) {
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      const { supabaseAdmin } = await import('@/lib/supabase/server')
      
      const scenesWithSignedUrls = await Promise.all(
        storybook.scenes.map(async (scene: any) => {
          if (scene.image_url) {
            try {
              // Extract path from URL
              // URL format: https://xxx.supabase.co/storage/v1/object/public/storybook-scenes/{storybook_id}/scene-{number}.jpg
              const urlMatch = scene.image_url.match(/storybook-scenes\/(.+)$/)
              if (urlMatch) {
                const path = urlMatch[1]
                // Generate signed URL (valid for 1 hour)
                const signedUrl = await getSignedUrl('storybook-scenes', path, 3600)
                return {
                  ...scene,
                  image_url: signedUrl,
                }
              }
            } catch (err) {
              console.error(`Failed to generate signed URL for scene ${scene.scene_number}:`, err)
              // Return original URL if signed URL generation fails
            }
          }
          return scene
        })
      )
      
      return NextResponse.json({
        ...storybook,
        scenes: scenesWithSignedUrls,
      })
    }

    return NextResponse.json(storybook)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/storybooks/:id
 * Delete storybook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params
    
    // Check ownership
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!storybook || storybook.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    // Delete scenes from storage (if any)
    if (storybook.scenes) {
      const { deleteFromStorage } = await import('@/lib/supabase/storage')
      const scenes = Array.isArray(storybook.scenes) ? storybook.scenes : []
      
      await Promise.all(
        scenes.map((scene: any) => {
          if (scene.image_url) {
            // Extract path from URL
            const url = new URL(scene.image_url)
            const path = url.pathname.split('/storybook-scenes/')[1]
            if (path) {
              return deleteFromStorage('storybook-scenes', path).catch(() => {})
            }
          }
        })
      )
    }

    // Delete storybook (cascade will handle generation_jobs)
    const { error } = await supabase
      .from('storybooks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

