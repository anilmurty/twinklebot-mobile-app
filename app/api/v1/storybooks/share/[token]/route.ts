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
        template:story_templates(id, title, script_data)
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

    // Build a map of scene_number → headline from template script_data
    const templateHeadlines: Record<number, string> = {}
    if (storybook.template?.script_data?.scenes) {
      for (const ts of storybook.template.script_data.scenes) {
        if (ts.scene_number && ts.headline) {
          templateHeadlines[ts.scene_number] = ts.headline
        }
      }
    }

    // Generate signed URLs for scene images (bucket is private)
    if (storybook.scenes && Array.isArray(storybook.scenes) && storybook.scenes.length > 0) {
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      
      // Sort scenes by scene_number to ensure correct order
      const sortedScenes = [...storybook.scenes].sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))
      
      const scenesWithSignedUrls = await Promise.all(
        sortedScenes.map(async (scene: any) => {
          const headline = scene.headline || templateHeadlines[scene.scene_number] || null
          if (scene.image_url) {
            try {
              const urlMatch = scene.image_url.match(/storybook-scenes\/(.+)$/)
              if (urlMatch) {
                const path = urlMatch[1]
                const signedUrl = await getSignedUrl('storybook-scenes', path, 3600)
                return { ...scene, headline, image_url: signedUrl }
              }
            } catch (err) {
              console.error(`Failed to generate signed URL for scene ${scene.scene_number}:`, err)
            }
          }
          return { ...scene, headline }
        })
      )

      const { template: _tpl, ...storybookWithoutTemplate } = storybook
      return NextResponse.json({
        ...storybookWithoutTemplate,
        template: { id: storybook.template?.id, title: storybook.template?.title },
        character_name: storybook.character?.name || '',
        scenes: scenesWithSignedUrls,
      })
    }

    const { template: _tpl2, ...storybookWithoutTemplate2 } = storybook
    return NextResponse.json({
      ...storybookWithoutTemplate2,
      template: { id: storybook.template?.id, title: storybook.template?.title },
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

