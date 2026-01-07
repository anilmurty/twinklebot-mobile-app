import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/storybooks/:id/revoke-share
 * Revoke/remove the shareable token for a storybook
 */
export async function POST(
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
    
    // Verify storybook exists and belongs to user
    const { data: storybook, error: fetchError } = await supabase
      .from('storybooks')
      .select('id, share_token')
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // If no share token exists, nothing to revoke
    if (!storybook.share_token) {
      return NextResponse.json({ 
        message: 'No share link exists for this storybook',
        revoked: false
      })
    }

    // Remove share token (set to NULL)
    const { error: updateError } = await supabaseAdmin
      .from('storybooks')
      .update({ share_token: null })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Share link revoked successfully',
      revoked: true
    })
  } catch (error: any) {
    console.error('Error revoking share token:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

