import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/storybooks/share/:token
 * Get a shared storybook by share token (public endpoint, no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    const { token } = 'then' in params ? await params : params
    
    // Fetch storybook by share_token (only completed storybooks can be shared)
    const { data: storybook, error } = await supabaseAdmin
      .from('storybooks')
      .select(`
        id,
        title,
        status,
        scenes,
        character:characters(id, name),
        template:story_templates(id, title)
      `)
      .eq('share_token', token)
      .eq('status', 'completed')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Shared storybook not found or link is invalid' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for scene images (bucket is private)
    if (storybook.scenes && Array.isArray(storybook.scenes) && storybook.scenes.length > 0) {
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      
      // Sort scenes by scene_number to ensure correct order
      const sortedScenes = [...storybook.scenes].sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))
      
      const scenesWithSignedUrls = await Promise.all(
        sortedScenes.map(async (scene: any) => {
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
        character_name: storybook.character?.name || '',
        scenes: scenesWithSignedUrls,
      })
    }

    return NextResponse.json({
      ...storybook,
      character_name: storybook.character?.name || '',
    })
  } catch (error: any) {
    console.error('Error fetching shared storybook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

