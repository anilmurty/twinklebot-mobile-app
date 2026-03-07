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

    // Derive mock_story_data from script_data when missing
    if ((!result.mock_story_data || !result.mock_story_data.scenes || result.mock_story_data.scenes.length === 0)
        && result.script_data?.scenes?.length > 0) {
      const folderPrefix = data.thumbnail_url
        ? data.thumbnail_url.replace(/^\//, '').split('/')[0]
        : ''
      result.mock_story_data = {
        character_name: 'Alex',
        scenes: result.script_data.scenes.map((scene: any) => ({
          scene_number: scene.scene_number,
          headline: scene.headline,
          script_text: scene.script_text,
          image_url: folderPrefix ? `/${folderPrefix}/${scene.base_photo}` : scene.base_photo,
        })),
      }
    }

    // Process mock_story_data image URLs if present
    if (result.mock_story_data && result.mock_story_data.scenes) {
      console.log(`[Template ${templateId}] Processing mock_story_data with ${result.mock_story_data.scenes.length} scenes`)
      result.mock_story_data = {
        ...result.mock_story_data,
        scenes: await Promise.all(
          result.mock_story_data.scenes.map(async (scene: any) => {
            if (scene.image_url && scene.image_url.startsWith('/') && !scene.image_url.startsWith('http')) {
              const storagePath = scene.image_url.slice(1)
              try {
                const fullUrl = getStorageUrl('story-template-assets', storagePath)
                console.log(`[Template ${templateId}] Converted mock scene image: ${scene.image_url} -> ${fullUrl}`)
                return {
                  ...scene,
                  image_url: fullUrl
                }
              } catch (err) {
                console.error(`[Template ${templateId}] Failed to get storage URL for mock scene image ${storagePath}:`, err)
                return scene
              }
            } else if (scene.image_url) {
              console.log(`[Template ${templateId}] Scene ${scene.scene_number} already has full URL: ${scene.image_url}`)
            }
            return scene
          })
        )
      }
      console.log(`[Template ${templateId}] Processed mock_story_data, first scene URL: ${result.mock_story_data.scenes[0]?.image_url}`)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
