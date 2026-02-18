import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

/**
 * GET /api/v1/storybooks/:id/status
 * Get storybook generation status
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
      .select('id, status, progress, scenes, template:story_templates(scene_count, script_data)')
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate current scene (completed with image) and total scenes from template
    const scenes = Array.isArray(storybook.scenes) ? storybook.scenes : []
    const completedScenes = scenes.filter((s: any) => s.image_url).length
    const template = storybook.template as any
    const totalScenes = template?.script_data?.scenes?.length || template?.scene_count || 0

    return NextResponse.json({
      id: storybook.id,
      status: storybook.status,
      progress: storybook.progress,
      current_scene: completedScenes,
      total_scenes: totalScenes,
      estimated_completion: storybook.status === 'generating'
        ? new Date(Date.now() + (totalScenes - completedScenes) * 15000).toISOString()
        : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
