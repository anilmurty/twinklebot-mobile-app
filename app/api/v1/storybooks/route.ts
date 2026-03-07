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
        share_token,
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

    // Generate thumbnails and proxy URLs for storybooks
    const { getImageProxyUrl } = await import('@/lib/utils/image-proxy')
    const userId = user.data.user?.id!
    const storybooksWithThumbnails = await Promise.all(
      (storybooks || []).map(async (sb: any) => {
        const result: any = {
          ...sb,
          character_name: sb.character?.name || '',
          total_scenes: sb.template?.scene_count || 0, // Add total_scenes from template
        }

        // Determine thumbnail URL based on storybook status
        let thumbnailUrl: string | null = null
        
        // If preview is generating (preview_pending with no scenes), use template cover image (cover.png)
        const isGeneratingPreview = sb.status === 'preview_pending' && (!sb.scenes || sb.scenes.length === 0)
        if (isGeneratingPreview) {
          // Prioritize template thumbnail (cover image) for generating preview state
          let templateThumbnailUrl = sb.template?.thumbnail_url || null
          if (templateThumbnailUrl && templateThumbnailUrl.startsWith('/') && !templateThumbnailUrl.startsWith('http')) {
            // Convert relative path like "/day-at-the-zoo/cover.png" to Supabase Storage URL
            const storagePath = templateThumbnailUrl.slice(1) // Remove leading slash
            const { getStorageUrl } = await import('@/lib/supabase/storage')
            try {
              templateThumbnailUrl = getStorageUrl('story-template-assets', storagePath)
              thumbnailUrl = templateThumbnailUrl
            } catch (err) {
              console.error(`Failed to convert template thumbnail URL for storybook ${sb.id}:`, err)
              templateThumbnailUrl = null
            }
          } else if (templateThumbnailUrl && templateThumbnailUrl.includes('supabase.co')) {
            // Already a full URL, use as is
            thumbnailUrl = templateThumbnailUrl
          }
          
          // Also set first_scene_base_image for potential use in preview generation
          if (sb.template?.script_data?.scenes) {
            const scenes = sb.template.script_data.scenes as any[]
            if (scenes && scenes.length > 0) {
              const firstScene = scenes.reduce((prev, curr) => 
                (curr.scene_number < prev.scene_number) ? curr : prev
              )
              if (firstScene.base_photo) {
                // Construct base photo path
                let basePhotoPath: string
                const templateThumbnailPath = sb.template?.thumbnail_url || ''
                if (templateThumbnailPath && templateThumbnailPath.includes('/')) {
                  const thumbnailParts = templateThumbnailPath.split('/')
                  if (thumbnailParts.length >= 2) {
                    const folder = thumbnailParts[1] // Extract folder name (e.g., "day-at-the-zoo")
                    basePhotoPath = `${folder}/${firstScene.base_photo}`
                  } else {
                    basePhotoPath = `day-at-the-zoo/${firstScene.base_photo}`
                  }
                } else {
                  basePhotoPath = `day-at-the-zoo/${firstScene.base_photo}`
                }
                
                // Get public URL from Supabase Storage
                const { getStorageUrl } = await import('@/lib/supabase/storage')
                try {
                  result.first_scene_base_image = getStorageUrl('story-template-assets', basePhotoPath)
                } catch (err) {
                  console.error(`Failed to get base photo URL for storybook ${sb.id}:`, err)
                }
              }
            }
          }
        }
        
        // If no thumbnail found yet, use template thumbnail as fallback
        if (!thumbnailUrl) {
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
          thumbnailUrl = templateThumbnailUrl
        }
        result.thumbnail_url = thumbnailUrl
        
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
                const urlMatch = firstScene.image_url.match(/storybook-scenes\/(.+?)(\?|$)/)
                if (urlMatch) {
                  const proxyUrl = getImageProxyUrl('storybook-scenes', urlMatch[1], userId)
                  // Replace template thumbnail with first scene image
                  result.thumbnail_url = proxyUrl
                  result.first_scene_image = proxyUrl
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
    const { character_id, template_id, look_id } = body

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
      .select('id, title, scene_count, script_data')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Guard: reject coming-soon templates (empty scenes)
    const templateScenes = (template as any).script_data?.scenes
    if (!templateScenes || !Array.isArray(templateScenes) || templateScenes.length === 0) {
      return NextResponse.json(
        { error: 'This story is coming soon and not yet available for generation' },
        { status: 400 }
      )
    }

    // Fetch profile for monthly limit info
    const { data: profile } = await supabase
      .from('profiles')
      .select('stories_generated_this_month, stories_per_month, custom_stories_per_month')
      .eq('id', userId)
      .single()

    const effectiveLimit = profile?.custom_stories_per_month ?? profile?.stories_per_month ?? 1

    // Prevent preview abuse - limit concurrent preview_pending storybooks
    const { count: pendingPreviews } = await supabase
      .from('storybooks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'preview_pending')

    const MAX_CONCURRENT_PREVIEWS = 5
    if ((pendingPreviews || 0) >= MAX_CONCURRENT_PREVIEWS) {
      return NextResponse.json(
        { error: 'You have too many previews pending. Please complete or delete existing previews before creating new ones.' },
        { status: 429 }
      )
    }

    // Check payment override and subscription status
    const { data: profileWithOverride } = await supabase
      .from('profiles')
      .select('payment_override')
      .eq('id', userId)
      .single()

    const { data: activeSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    const hasPaymentOverride = profileWithOverride?.payment_override === true
    const hasActiveSubscription = !!activeSubscription

    // Subscription/override users can skip preview IF within their monthly limit
    const shouldSkipPreview = (hasPaymentOverride || hasActiveSubscription)
    const withinFreeLimit = !profile || profile.stories_generated_this_month < effectiveLimit

    // Always create as preview_pending initially
    const { data: storybook, error: createError } = await supabase
      .from('storybooks')
      .insert({
        user_id: userId,
        character_id,
        template_id,
        title: template.title,
        status: 'preview_pending',
        progress: 0,
        look_id: look_id || null, // Store selected look, null means original
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // If user can skip preview AND is within their free monthly limit,
    // upgrade to pending and start full generation immediately
    if (shouldSkipPreview && withinFreeLimit) {
      await supabase
        .from('storybooks')
        .update({ status: 'pending' })
        .eq('id', storybook.id)
      storybook.status = 'pending'

      // Increment monthly counter only for free generations
      await supabase
        .from('profiles')
        .update({
          stories_generated_this_month: (profile?.stories_generated_this_month || 0) + 1,
        })
        .eq('id', userId)

      // Create generation job
      await supabaseAdmin
        .from('generation_jobs')
        .insert({
          storybook_id: storybook.id,
          status: 'queued',
          total_scenes: template.scene_count || 10,
        })

      // Start generation (async - don't wait)
      if (process.env.NODE_ENV === 'development') {
        const { generateStorybook } = await import('@/lib/services/storybook-generator')
        generateStorybook(storybook.id).catch((error) => {
          console.error(`Background generation error for ${storybook.id}:`, error)
        })
      }
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
        message: storybook.status === 'pending'
          ? 'Storybook created and generation started'
          : 'Storybook created. Preview generation will start.',
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
