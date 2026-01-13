import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/story-templates/:id
 * Get a single story template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = 'then' in params ? await params : params
    const templateId = parseInt(id)

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('story_templates')
      .select('id, title, description, category, age_range, scene_count, cover_label, thumbnail_url, script_data, mock_story_data')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Process thumbnail URL
    const { getStorageUrl } = await import('@/lib/supabase/storage')
    const result: any = { ...data }

    if (data.thumbnail_url) {
      if (data.thumbnail_url.startsWith('/') && !data.thumbnail_url.startsWith('http')) {
        const storagePath = data.thumbnail_url.slice(1)
        try {
          result.thumbnail_url = getStorageUrl('story-template-assets', storagePath)
        } catch (err) {
          console.error(`Failed to get storage URL for ${storagePath}:`, err)
          result.thumbnail_url = null
        }
      } else if (data.thumbnail_url.includes('/object/public/')) {
        result.thumbnail_url = data.thumbnail_url
      } else if (data.thumbnail_url.includes('supabase.co')) {
        const { getSignedUrl } = await import('@/lib/supabase/storage')
        try {
          const urlMatch = data.thumbnail_url.match(/story-template-assets\/(.+)$/)
          if (urlMatch) {
            result.thumbnail_url = await getSignedUrl('story-template-assets', urlMatch[1], 3600)
          }
        } catch (err) {
          console.error(`Failed to generate signed URL:`, err)
          result.thumbnail_url = null
        }
      }
    }

    // Process mock_story_data image URLs if present
    if (result.mock_story_data && result.mock_story_data.scenes) {
      result.mock_story_data = {
        ...result.mock_story_data,
        scenes: await Promise.all(
          result.mock_story_data.scenes.map(async (scene: any) => {
            if (scene.image_url && scene.image_url.startsWith('/') && !scene.image_url.startsWith('http')) {
              const storagePath = scene.image_url.slice(1)
              try {
                return {
                  ...scene,
                  image_url: getStorageUrl('story-template-assets', storagePath)
                }
              } catch (err) {
                console.error(`Failed to get storage URL for mock scene image ${storagePath}:`, err)
                return scene
              }
            }
            return scene
          })
        )
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
