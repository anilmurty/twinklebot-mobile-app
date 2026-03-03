import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { getImageProxyUrl } from '@/lib/utils/image-proxy'

/**
 * GET /api/v1/storybooks/:id
 * Get storybook details with scenes
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
      .select(`
        *,
        character:characters(id, name),
        template:story_templates(id, title, script_data)
      `)
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Build a map of scene_number → headline from template script_data
    // Used to fill in missing headlines for scenes generated before the fix
    const templateHeadlines: Record<number, string> = {}
    if (storybook.template?.script_data?.scenes) {
      for (const ts of storybook.template.script_data.scenes) {
        if (ts.scene_number && ts.headline) {
          templateHeadlines[ts.scene_number] = ts.headline
        }
      }
    }

    // Generate proxy URLs for scene images (stable URLs that allow browser caching)
    if (storybook.scenes && Array.isArray(storybook.scenes)) {
      // Sort scenes by scene_number to ensure correct order
      const sortedScenes = [...storybook.scenes].sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))

      const scenesWithProxyUrls = sortedScenes.map((scene: any) => {
        // Fill in missing headline from template script_data
        const headline = scene.headline || templateHeadlines[scene.scene_number] || null

        if (scene.image_url) {
          try {
            // Extract path from URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/storybook-scenes/{storybook_id}/scene-{number}.jpg
            const urlMatch = scene.image_url.match(/storybook-scenes\/(.+?)(\?|$)/)
            if (urlMatch) {
              const path = urlMatch[1]
              // Generate proxy URL (stable, cacheable)
              const proxyUrl = getImageProxyUrl('storybook-scenes', path)
              return {
                ...scene,
                headline,
                image_url: proxyUrl,
              }
            }
          } catch (err) {
            console.error(`Failed to generate proxy URL for scene ${scene.scene_number}:`, err)
            // Return original URL if proxy URL generation fails
          }
        }
        return { ...scene, headline }
      })

      const { template: _tpl, ...storybookWithoutTemplate } = storybook
      return NextResponse.json({
        ...storybookWithoutTemplate,
        template: { id: storybook.template?.id, title: storybook.template?.title },
        character_name: storybook.character?.name || '',
        scenes: scenesWithProxyUrls,
      })
    }

    const { template: _tpl2, ...storybookWithoutTemplate2 } = storybook
    return NextResponse.json({
      ...storybookWithoutTemplate2,
      template: { id: storybook.template?.id, title: storybook.template?.title },
      character_name: storybook.character?.name || '',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/storybooks/:id
 * Delete storybook
 */
export async function DELETE(
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
    
    // Check ownership and get storybook data including character_id and template_id
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id, character_id, template_id, scenes')
      .eq('id', id)
      .single()

    if (!storybook || storybook.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    const characterId = storybook.character_id
    const templateId = storybook.template_id

    // Delete scenes from storage
    const { deleteFromStorage } = await import('@/lib/supabase/storage')
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    
    // Delete scene images from the scenes array (if any)
    if (storybook.scenes) {
      const scenes = Array.isArray(storybook.scenes) ? storybook.scenes : []
      
      await Promise.all(
        scenes.map(async (scene: any) => {
          if (scene.image_url) {
            try {
              // Extract path from URL
              let path: string | null = null
              
              if (scene.image_url.includes('storybook-scenes/')) {
                const match = scene.image_url.match(/storybook-scenes\/(.+)$/)
                if (match) {
                  path = match[1]
                } else {
                  try {
                    const url = new URL(scene.image_url)
                    path = url.pathname.split('/storybook-scenes/')[1]
                  } catch {
                    if (scene.image_url.startsWith('storybook-scenes/')) {
                      path = scene.image_url.replace('storybook-scenes/', '')
                    }
                  }
                }
              }
              
              if (path) {
                await deleteFromStorage('storybook-scenes', path).catch((err) => {
                  console.error(`Failed to delete scene image ${path}:`, err)
                })
              }
            } catch (err) {
              console.error(`Error processing scene image deletion:`, err)
            }
          }
        })
      )
    }

    // Also delete all scene images for this storybook ID from storage as a fallback
    // This ensures cleanup even if scenes weren't properly saved to the database
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('storybook-scenes')
        .list(id, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (!listError && files && files.length > 0) {
        console.log(`Found ${files.length} scene file(s) in storage for storybook ${id}`)
        await Promise.all(
          files.map(async (file) => {
            const filePath = `${id}/${file.name}`
            await deleteFromStorage('storybook-scenes', filePath).catch((err) => {
              console.error(`Failed to delete scene file ${filePath}:`, err)
            })
          })
        )
        console.log(`✅ Deleted ${files.length} scene file(s) from storage`)
      }
    } catch (err) {
      console.error(`Error listing/deleting scene files from storage:`, err)
      // Continue even if this fails
    }

    // Delete storybook (cascade will handle generation_jobs)
    const { error } = await supabase
      .from('storybooks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // IMPORTANT: Do NOT decrement stories_generated_this_month counter on delete
    // Once a user has created a story (counted against their monthly limit), 
    // deleting it does not allow them to create more stories.
    // This prevents the workaround of creating/deleting stories to bypass limits.
    // The counter only resets monthly via cron job.

    // Check if any other storybooks exist for this character-template combination
    const { data: remainingStorybooks } = await supabase
      .from('storybooks')
      .select('id')
      .eq('character_id', characterId)
      .eq('template_id', templateId)
      .limit(1)

    // If no other storybooks exist for this combination, delete character variations
    if (!remainingStorybooks || remainingStorybooks.length === 0) {
      const { deleteCharacterVariations } = await import('@/lib/services/character-variation-generator')
      try {
        await deleteCharacterVariations(characterId, templateId, user.data.user?.id!)
        console.log(`Deleted character variations for character ${characterId} and template ${templateId}`)
      } catch (err) {
        console.error(`Failed to delete character variations:`, err)
        // Don't fail the request if variation deletion fails
      }
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
