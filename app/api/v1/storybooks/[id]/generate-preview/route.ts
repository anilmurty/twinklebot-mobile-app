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
  const apiStartTime = Date.now()
  console.log(`[API] POST /generate-preview called at ${new Date().toISOString()}`)
  
  try {
    const authStart = Date.now()
    const user = await getAuthUser(request)
    console.log(`[TIMING] Auth check: ${Date.now() - authStart}ms`)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params

    // Verify ownership
    const ownershipCheckStart = Date.now()
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id, status')
      .eq('id', id)
      .single()
    console.log(`[TIMING] Ownership check: ${Date.now() - ownershipCheckStart}ms`)

    if (!storybook || storybook.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    // Check if preview already exists
    if (storybook.status === 'preview_pending') {
      const existingCheckStart = Date.now()
      // Get the preview scene
      const { data: fullStorybook } = await supabase
        .from('storybooks')
        .select('scenes, character:characters(name), template:story_templates(title)')
        .eq('id', id)
        .single()
      console.log(`[TIMING] Existing preview check: ${Date.now() - existingCheckStart}ms`)

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

    const totalApiTime = Date.now() - apiStartTime
    console.log(`[TIMING] ⏱️  API endpoint total time before calling generatePreview: ${totalApiTime}ms (${(totalApiTime/1000).toFixed(2)}s)`)

    // Start preview generation (async - don't wait)
    const generatePreviewStart = Date.now()
    console.log(`[TIMING] Calling generatePreview at ${new Date().toISOString()}`)
    generatePreview(id)
      .then((result) => {
        console.log(`Preview generation completed for ${id}`)
      })
      .catch((error) => {
        console.error(`Preview generation error for ${id}:`, error)
      })
    console.log(`[TIMING] generatePreview call initiated (async): ${Date.now() - generatePreviewStart}ms`)

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

