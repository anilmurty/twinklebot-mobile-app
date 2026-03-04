import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { generateStorybook } from '@/lib/services/storybook-generator'
import { waitUntil } from '@vercel/functions'

// Allow up to 5 minutes for storybook generation
export const maxDuration = 300

/**
 * POST /api/v1/storybooks/[id]/use-credit
 * Use a story credit to unlock and generate a storybook
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: storybookId } = await params
    const userId = user.data.user?.id!

    // Check if storybook exists and belongs to user
    const supabase = createServerClient(request.headers.get('authorization'))
    const { data: storybook, error: storybookError } = await supabase
      .from('storybooks')
      .select('id, user_id, status')
      .eq('id', storybookId)
      .single()

    if (storybookError || !storybook) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    if (storybook.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (storybook.status !== 'preview_pending') {
      return NextResponse.json(
        { error: 'Storybook is not in preview_pending status' },
        { status: 400 }
      )
    }

    // Check if user has credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('story_credits')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const currentCredits = profile.story_credits || 0
    if (currentCredits < 1) {
      return NextResponse.json(
        { error: 'No story credits available', credits: currentCredits },
        { status: 400 }
      )
    }

    // Deduct 1 credit
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        story_credits: currentCredits - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to deduct credit' },
        { status: 500 }
      )
    }

    // Update storybook payment status
    await supabaseAdmin
      .from('storybooks')
      .update({
        payment_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybookId)

    // Start storybook generation in the background, kept alive by waitUntil
    waitUntil(
      generateStorybook(storybookId).catch((error: any) => {
        console.error(`Failed to start generation for storybook ${storybookId}:`, error)
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Credit used successfully',
      remaining_credits: currentCredits - 1,
      storybook_id: storybookId,
    })
  } catch (error: any) {
    console.error('Error using credit:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


