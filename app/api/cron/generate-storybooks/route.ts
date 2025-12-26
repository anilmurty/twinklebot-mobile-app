import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateStorybook } from '@/lib/services/storybook-generator'

/**
 * POST /api/cron/generate-storybooks
 * Vercel Cron Job endpoint to process pending storybooks
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-storybooks",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find pending or generating storybooks
    const { data: pendingStorybooks, error } = await supabaseAdmin
      .from('storybooks')
      .select('id, status')
      .in('status', ['pending', 'generating'])
      .order('created_at', { ascending: true })
      .limit(1) // Process one at a time

    if (error) {
      console.error('Error fetching pending storybooks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!pendingStorybooks || pendingStorybooks.length === 0) {
      return NextResponse.json({ message: 'No pending storybooks' })
    }

    const storybook = pendingStorybooks[0]

    // Update generation job status
    await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('storybook_id', storybook.id)
      .eq('status', 'queued')

    try {
      // Generate storybook
      await generateStorybook(storybook.id)
      return NextResponse.json({
        message: `Successfully processed storybook ${storybook.id}`,
      })
    } catch (genError: any) {
      console.error(`Error generating storybook ${storybook.id}:`, genError)

      // Update job status to failed
      await supabaseAdmin
        .from('generation_jobs')
        .update({
          status: 'failed',
          error_message: genError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('storybook_id', storybook.id)

      return NextResponse.json(
        { error: genError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}

