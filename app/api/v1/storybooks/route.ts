import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/storybooks
 * List all storybooks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('storybooks')
      .select(`
        id,
        title,
        status,
        progress,
        created_at,
        completed_at,
        scenes,
        character:characters(id, name),
        template:story_templates(id, title, thumbnail_url, scene_count)
      `)
      .eq('user_id', user.data.user?.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: storybooks, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate thumbnails and signed URLs for storybooks
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    const storybooksWithThumbnails = await Promise.all(
      (storybooks || []).map(async (sb: any) => {
        const result: any = {
          ...sb,
          character_name: sb.character?.name || '',
          total_scenes: sb.template?.scene_count || 0, // Add total_scenes from template
        }

        // Always start with template thumbnail, then replace with first scene when available
        // Default to template thumbnail - convert if it's a relative path
        let templateThumbnailUrl = sb.template?.thumbnail_url || null
        if (templateThumbnailUrl && templateThumbnailUrl.startsWith('/') && !templateThumbnailUrl.startsWith('http')) {
          // Convert relative path like "/day-at-the-zoo/cover.png" to Supabase Storage URL
          const storagePath = templateThumbnailUrl.slice(1) // Remove leading slash
          const { getStorageUrl } = await import('@/lib/supabase/storage')
          try {
            templateThumbnailUrl = getStorageUrl('story-template-assets', storagePath)
          } catch (err) {
            console.error(`Failed to convert template thumbnail URL for storybook ${sb.id}:`, err)
            templateThumbnailUrl = null
          }
        }
        result.thumbnail_url = templateThumbnailUrl
        
        // Generate thumbnail from first scene if available (even during generation)
        if (sb.scenes && Array.isArray(sb.scenes) && sb.scenes.length > 0) {
          // Find first scene with an image_url (scenes may not be in order)
          const scenesWithImages = sb.scenes.filter((s: any) => s.image_url)
          if (scenesWithImages.length > 0) {
            // Sort by scene_number to get the actual first scene
            scenesWithImages.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))
            const firstScene = scenesWithImages[0]
            if (firstScene.image_url) {
              try {
                const urlMatch = firstScene.image_url.match(/storybook-scenes\/(.+)$/)
                if (urlMatch) {
                  const signedUrl = await getSignedUrl('storybook-scenes', urlMatch[1], 3600)
                  // Replace template thumbnail with first scene image
                  result.thumbnail_url = signedUrl
                  result.first_scene_image = signedUrl
                }
              } catch (err) {
                console.error(`Failed to generate thumbnail for storybook ${sb.id}:`, err)
                // Keep template thumbnail on error
              }
            }
          }
        }

        return result
      })
    )

    // Get total count
    let countQuery = supabase
      .from('storybooks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.data.user?.id)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      storybooks: storybooksWithThumbnails || [],
      total: count || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/storybooks
 * Create a new storybook and start generation
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/v1/storybooks called')
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { character_id, template_id } = body

    if (!character_id || !template_id) {
      return NextResponse.json(
        { error: 'character_id and template_id are required' },
        { status: 400 }
      )
    }

    const userId = user.data.user?.id!
    const userEmail = user.data.user?.email || ''
    const supabase = createServerClient(request.headers.get('authorization'))
    const { supabaseAdmin } = await import('@/lib/supabase/server')

    // Ensure profile exists (create if doesn't exist)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Create profile for this user
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
        })
    }

    // Verify character belongs to user
    const { data: character } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', character_id)
      .eq('user_id', userId)
      .single()

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Get template
    const { data: template } = await supabaseAdmin
      .from('story_templates')
      .select('id, title, scene_count')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check monthly limit (with custom override support)
    const { data: profile } = await supabase
      .from('profiles')
      .select('stories_generated_this_month, stories_per_month, custom_stories_per_month')
      .eq('id', userId)
      .single()

    // Use custom limit if set, otherwise use plan limit (default is 1)
    const effectiveLimit = profile?.custom_stories_per_month ?? profile?.stories_per_month ?? 1

    if (profile && profile.stories_generated_this_month >= effectiveLimit) {
      // Provide helpful error message based on limit
      const limitMessage = effectiveLimit === 1 
        ? 'You have already created your story for this month. Deleting stories does not allow you to create more.'
        : `Monthly story limit reached (${effectiveLimit} stories). Deleting stories does not allow you to create more.`
      
      return NextResponse.json(
        { error: limitMessage },
        { status: 403 }
      )
    }

    // Create storybook
    const { data: storybook, error: createError } = await supabase
      .from('storybooks')
      .insert({
        user_id: userId,
        character_id,
        template_id,
        title: template.title,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Create generation job
    const { error: jobError } = await supabaseAdmin
      .from('generation_jobs')
      .insert({
        storybook_id: storybook.id,
        status: 'queued',
        total_scenes: template.scene_count || 10,
      })

    if (jobError) {
      console.error('Failed to create generation job:', jobError)
    }

    // Increment monthly counter
    await supabase
      .from('profiles')
      .update({
        stories_generated_this_month: (profile?.stories_generated_this_month || 0) + 1,
      })
      .eq('id', userId)

    // Auto-start generation in development (for testing)
    // In production, cron job will pick it up
    if (process.env.NODE_ENV === 'development') {
      const { generateStorybook } = await import('@/lib/services/storybook-generator')
      // Start generation asynchronously (don't wait)
      generateStorybook(storybook.id).catch((error) => {
        console.error(`Background generation error for ${storybook.id}:`, error)
      })
    }

    return NextResponse.json(
      {
        id: storybook.id,
        title: storybook.title,
        status: storybook.status,
        progress: storybook.progress,
        character: {
          id: character.id,
          name: character.name,
        },
        template: {
          id: template.id,
          title: template.title,
        },
        created_at: storybook.created_at,
        message: process.env.NODE_ENV === 'development' 
          ? 'Storybook created and generation started (dev mode)'
          : 'Storybook created and queued for generation',
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
