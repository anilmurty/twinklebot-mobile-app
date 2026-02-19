import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/v1/storybooks/:id/generate-share
 * Generate a shareable token for a completed storybook (on-demand)
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
      .select('id, status, share_token')
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Only allow sharing for completed storybooks
    if (storybook.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed storybooks can be shared' },
        { status: 400 }
      )
    }

    // If share token already exists, return it
    if (storybook.share_token) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
      const shareUrl = `${baseUrl}/share/${storybook.share_token}`
      return NextResponse.json({ 
        share_token: storybook.share_token,
        share_url: shareUrl
      })
    }

    // Generate a unique share token using Web Crypto API (works in all runtimes)
    let shareToken = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      shareToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

      // Check if token already exists
      const { data: existing } = await supabaseAdmin
        .from('storybooks')
        .select('id')
        .eq('share_token', shareToken)
        .single()

      if (!existing) {
        isUnique = true
      } else {
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique share token' },
        { status: 500 }
      )
    }

    // Update storybook with share token
    const { error: updateError } = await supabaseAdmin
      .from('storybooks')
      .update({ share_token: shareToken })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${shareToken}`

    return NextResponse.json({ 
      share_token: shareToken,
      share_url: shareUrl
    })
  } catch (error: any) {
    console.error('Error generating share token:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

