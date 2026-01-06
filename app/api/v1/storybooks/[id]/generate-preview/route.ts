import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { generatePreview } from '@/lib/services/preview-generator'

/**
 * POST /api/v1/storybooks/:id/generate-preview
 * Generate character variations + first scene only (preview)
 */
export async function POST(
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

    // Verify ownership
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (!storybook || storybook.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    // Check if preview already exists
    if (storybook.status === 'preview_pending') {
      // Get the preview scene
      const { data: fullStorybook } = await supabase
        .from('storybooks')
        .select('scenes, character:characters(name), template:story_templates(title)')
        .eq('id', id)
        .single()

      if (fullStorybook?.scenes && Array.isArray(fullStorybook.scenes) && fullStorybook.scenes.length > 0) {
        const firstScene = fullStorybook.scenes[0]
        return NextResponse.json({
          storybook_id: id,
          first_scene_image_url: firstScene.image_url,
          character_name: (fullStorybook.character as any)?.name,
          template_title: (fullStorybook.template as any)?.title,
          message: 'Preview already exists',
        })
      }
    }

    // Start preview generation (async - don't wait)
    generatePreview(id)
      .then((result) => {
        console.log(`Preview generation completed for ${id}`)
      })
      .catch((error) => {
        console.error(`Preview generation error for ${id}:`, error)
      })

    return NextResponse.json({
      message: 'Preview generation started',
      storybook_id: id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

