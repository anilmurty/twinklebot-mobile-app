import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/v1/character-looks?template_id=1&gender=male
 * Get character looks for a specific template and gender
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')
    const gender = searchParams.get('gender')

    if (!templateId || !gender) {
      return NextResponse.json(
        { error: 'template_id and gender are required' },
        { status: 400 }
      )
    }

    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'gender must be "male" or "female"' },
        { status: 400 }
      )
    }

    const { data: looks, error } = await supabaseAdmin
      .from('character_looks')
      .select('*')
      .eq('template_id', parseInt(templateId))
      .eq('gender', gender)
      .eq('is_active', true)
      .order('is_original', { ascending: false }) // Original option first
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert relative image paths to full Supabase Storage URLs
    const { getStorageUrl } = await import('@/lib/supabase/storage')
    const looksWithUrls = (looks || []).map((look: any) => {
      const result = { ...look }
      
      // Convert reference_image_url (model image shown in UI)
      if (look.reference_image_url) {
        if (look.reference_image_url.startsWith('/') || (!look.reference_image_url.startsWith('http') && !look.reference_image_url.includes('supabase.co'))) {
          // Relative path - convert to Supabase Storage URL
          const storagePath = look.reference_image_url.startsWith('/') 
            ? look.reference_image_url.slice(1) 
            : look.reference_image_url
          try {
            result.reference_image_url = getStorageUrl('story-template-assets', storagePath)
            console.log(`[Look ${look.id}] Converted reference_image_url: ${look.reference_image_url} -> ${result.reference_image_url}`)
          } catch (err: any) {
            console.error(`[Look ${look.id}] Failed to convert reference_image_url:`, err)
            // Keep original URL if conversion fails
          }
        } else {
          // Already a full URL, use as-is
          result.reference_image_url = look.reference_image_url
        }
      }
      
      // Convert attire_image_url (sent to Replicate)
      if (look.attire_image_url) {
        if (look.attire_image_url.startsWith('/') || (!look.attire_image_url.startsWith('http') && !look.attire_image_url.includes('supabase.co'))) {
          // Relative path - convert to Supabase Storage URL
          const storagePath = look.attire_image_url.startsWith('/') 
            ? look.attire_image_url.slice(1) 
            : look.attire_image_url
          try {
            result.attire_image_url = getStorageUrl('story-template-assets', storagePath)
            console.log(`[Look ${look.id}] Converted attire_image_url: ${look.attire_image_url} -> ${result.attire_image_url}`)
          } catch (err: any) {
            console.error(`[Look ${look.id}] Failed to convert attire_image_url:`, err)
            // Keep original URL if conversion fails
          }
        } else {
          // Already a full URL, use as-is
          result.attire_image_url = look.attire_image_url
        }
      }
      
      return result
    })

    return NextResponse.json({ looks: looksWithUrls })
  } catch (error: any) {
    console.error('Error fetching character looks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

