import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { getStorageUrl } from '@/lib/supabase/storage'

/**
 * GET /api/v1/story-templates/by-slug/:slug
 * Get a single story template by slug, with coming-soon status and interest data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const { data, error } = await supabaseAdmin
      .from('story_templates')
      .select('id, slug, title, description, category, age_range, scene_count, cover_label, thumbnail_url, script_data, mock_story_data')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result: any = { ...data }

    // Process thumbnail URL
    if (data.thumbnail_url) {
      if (data.thumbnail_url.startsWith('/') && !data.thumbnail_url.startsWith('http')) {
        const storagePath = data.thumbnail_url.slice(1)
        try {
          result.thumbnail_url = getStorageUrl('story-template-assets', storagePath)
        } catch (err) {
          console.error(`Failed to get storage URL for ${storagePath}:`, err)
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

    // Process mock_story_data image URLs
    if (result.mock_story_data?.scenes) {
      result.mock_story_data = {
        ...result.mock_story_data,
        scenes: result.mock_story_data.scenes.map((scene: any) => {
          if (scene.image_url && scene.image_url.startsWith('/') && !scene.image_url.startsWith('http')) {
            const storagePath = scene.image_url.slice(1)
            try {
              return { ...scene, image_url: getStorageUrl('story-template-assets', storagePath) }
            } catch {
              return scene
            }
          }
          return scene
        }),
      }
    }

    // Compute coming-soon status
    const scenes = result.script_data?.scenes
    result.is_coming_soon = !scenes || !Array.isArray(scenes) || scenes.length === 0

    // Interest data
    const { data: interestCounts } = await supabaseAdmin
      .from('story_interest')
      .select('id')
      .eq('template_id', data.id)

    result.interest_count = interestCounts?.length || 0

    // Check if authed user has expressed interest
    const user = await getAuthUser(request)
    result.user_interested = false
    if (user) {
      const userId = user.data.user?.id
      if (userId) {
        const { data: interest } = await supabaseAdmin
          .from('story_interest')
          .select('id')
          .eq('user_id', userId)
          .eq('template_id', data.id)
          .maybeSingle()
        result.user_interested = !!interest
      }
    }

    // Strip script_data from response (large, not needed by client)
    delete result.script_data

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
