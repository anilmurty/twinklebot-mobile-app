import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { generateStorybook } from '@/lib/services/storybook-generator'
import { waitUntil } from '@vercel/functions'

// Allow up to 5 minutes for full storybook generation
export const maxDuration = 300

/**
 * POST /api/v1/storybooks/:id/generate
 * Manually trigger storybook generation (for testing)
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

    // Verify ownership
    const { data: storybook } = await supabase
      .from('storybooks')
      .select('id, user_id, status')
      .eq('id', id)
      .single()

    if (!storybook || storybook.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Storybook not found' }, { status: 404 })
    }

    if (storybook.status === 'completed') {
      return NextResponse.json({ message: 'Storybook already completed' })
    }

    // Start generation in background, kept alive by waitUntil
    waitUntil(
      generateStorybook(id).catch((error) => {
        console.error(`Background generation error for ${id}:`, error)
      })
    )

    return NextResponse.json({
      message: 'Generation started',
      storybook_id: id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
