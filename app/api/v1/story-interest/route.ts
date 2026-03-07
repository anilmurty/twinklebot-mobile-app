import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/story-interest
 * Record user interest in a coming-soon template (idempotent)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template_id } = body

    if (!template_id || typeof template_id !== 'number') {
      return NextResponse.json(
        { error: 'template_id is required and must be a number' },
        { status: 400 }
      )
    }

    const userId = user.data.user?.id!

    // Verify template exists and is coming-soon (empty scenes)
    const { data: template } = await supabaseAdmin
      .from('story_templates')
      .select('id, script_data')
      .eq('id', template_id)
      .eq('is_active', true)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const scenes = template.script_data?.scenes
    if (scenes && Array.isArray(scenes) && scenes.length > 0) {
      return NextResponse.json(
        { error: 'This template is already available for generation' },
        { status: 400 }
      )
    }

    // Upsert interest (idempotent - ignore conflict on unique constraint)
    const { error: insertError } = await supabaseAdmin
      .from('story_interest')
      .upsert(
        { user_id: userId, template_id },
        { onConflict: 'user_id,template_id' }
      )

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/story-interest
 * Remove user interest in a template
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'template_id query parameter is required' },
        { status: 400 }
      )
    }

    const userId = user.data.user?.id!

    const { error: deleteError } = await supabaseAdmin
      .from('story_interest')
      .delete()
      .eq('user_id', userId)
      .eq('template_id', parseInt(templateId))

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
