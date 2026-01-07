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

    return NextResponse.json({ looks: looks || [] })
  } catch (error: any) {
    console.error('Error fetching character looks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

