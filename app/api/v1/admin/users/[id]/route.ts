import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * DELETE /api/v1/admin/users/:id
 * Delete a user and all their data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const admin = await requireAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = 'then' in params ? await params : params

  // Don't allow deleting yourself
  if (id === admin.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // Delete in dependency order
  try {
    // Generation jobs
    await supabaseAdmin
      .from('generation_jobs')
      .delete()
      .in('storybook_id',
        (await supabaseAdmin.from('storybooks').select('id').eq('user_id', id)).data?.map(s => s.id) || []
      )

    // Storybooks
    await supabaseAdmin.from('storybooks').delete().eq('user_id', id)

    // Character variations
    const { data: chars } = await supabaseAdmin.from('characters').select('id').eq('user_id', id)
    if (chars && chars.length > 0) {
      await supabaseAdmin
        .from('character_variations')
        .delete()
        .in('character_id', chars.map(c => c.id))
    }

    // Characters
    await supabaseAdmin.from('characters').delete().eq('user_id', id)

    // Device tokens
    await supabaseAdmin.from('device_tokens').delete().eq('user_id', id)

    // Story interest
    await supabaseAdmin.from('story_interest').delete().eq('user_id', id)

    // Subscriptions
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', id)

    // Profile
    await supabaseAdmin.from('profiles').delete().eq('id', id)

    // Auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (authError) {
      console.error(`[ADMIN] Failed to delete auth user ${id}:`, authError.message)
      // Don't fail — profile data is already cleaned up
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[ADMIN] Delete user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
