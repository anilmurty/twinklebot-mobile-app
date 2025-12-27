import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/story-templates
 * List all active story templates
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('story_templates')
      .select('id, title, description, category, age_range, scene_count, cover_label, thumbnail_url, script_data')
      .eq('is_active', true)
      .order('id')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Process template URLs - use public URLs directly if available, otherwise generate signed URLs
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    const templatesWithUrls = await Promise.all(
      (data || []).map(async (template: any) => {
        const result: any = { ...template }
        
        // Process thumbnail URL
        if (template.thumbnail_url) {
          // Check if it's a placeholder path (starts with /) or invalid URL
          if (template.thumbnail_url.startsWith('/') && !template.thumbnail_url.startsWith('http')) {
            // Placeholder path - set to null so frontend can show placeholder
            console.warn(`[Template ${template.id}] Placeholder thumbnail URL detected: ${template.thumbnail_url}. Run migration 004_update_template_storage_urls.sql to update URLs.`)
            result.thumbnail_url = null
          } else if (template.thumbnail_url.includes('/object/public/')) {
            // Public URL - use as is (bucket is public)
            console.log(`[Template ${template.id}] Using public URL: ${template.thumbnail_url}`)
            result.thumbnail_url = template.thumbnail_url
          } else if (template.thumbnail_url.includes('supabase.co')) {
            // Supabase URL but not public - try to generate signed URL
            try {
              let path: string | null = null
              
              // Extract path from URL
              const urlMatch = template.thumbnail_url.match(/story-template-assets\/(.+)$/)
              if (urlMatch) {
                path = urlMatch[1]
              } else {
                // Try parsing as full URL
                try {
                  const urlObj = new URL(template.thumbnail_url)
                  const pathParts = urlObj.pathname.split('/story-template-assets/')
                  if (pathParts.length > 1) {
                    path = pathParts[1]
                  } else {
                    // Try extracting just the filename
                    const filenameMatch = urlObj.pathname.match(/\/(thumbnails|covers)\/(.+)$/)
                    if (filenameMatch) {
                      path = `${filenameMatch[1]}/${filenameMatch[2]}`
                    }
                  }
                } catch {
                  // If URL parsing fails, try direct path extraction
                  const directMatch = template.thumbnail_url.match(/(thumbnails|covers)\/(.+)$/)
                  if (directMatch) {
                    path = `${directMatch[1]}/${directMatch[2]}`
                  }
                }
              }
              
              if (path) {
                result.thumbnail_url = await getSignedUrl('story-template-assets', path, 3600)
              } else {
                console.warn(`Could not extract path from thumbnail URL for template ${template.id}: ${template.thumbnail_url}`)
                result.thumbnail_url = null
              }
            } catch (err) {
              console.error(`Failed to generate signed URL for template thumbnail ${template.id}:`, err)
              result.thumbnail_url = null
            }
          } else {
            // Not a Supabase URL - might be external, use as is
            result.thumbnail_url = template.thumbnail_url
          }
        } else {
          result.thumbnail_url = null
        }

        return result
      })
    )

    return NextResponse.json({ templates: templatesWithUrls || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

