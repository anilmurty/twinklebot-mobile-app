import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/cron/recover-stuck-storybooks
 *
 * Finds storybooks stuck in 'generating' for >10 minutes.
 * - If all scenes exist → marks as completed
 * - If some scenes missing → marks as 'pending' so the generation cron retries
 * - If stuck >30 minutes → sends email alert to admin
 *
 * Configure in vercel.json with schedule: every 5 minutes
 */

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

async function sendAlertEmail(subject: string, body: string) {
  if (!ADMIN_EMAIL || !RESEND_API_KEY) {
    console.warn(`[ALERT] No email config — logging instead: ${subject}\n${body}`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TwinkleBot Alerts <alerts@twinklebot.app>',
        to: [ADMIN_EMAIL],
        subject,
        text: body,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[ALERT] Failed to send email: ${err}`)
    } else {
      console.log(`[ALERT] Email sent: ${subject}`)
    }
  } catch (err) {
    console.error(`[ALERT] Email error:`, err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    // Find storybooks stuck in 'generating' for >10 minutes
    const { data: stuckBooks, error } = await supabaseAdmin
      .from('storybooks')
      .select('id, title, character_name, status, scenes, total_scenes, template_id, updated_at, user_id')
      .eq('status', 'generating')
      .lt('updated_at', tenMinAgo)
      .order('updated_at', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching stuck storybooks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!stuckBooks || stuckBooks.length === 0) {
      return NextResponse.json({ message: 'No stuck storybooks found' })
    }

    console.log(`[RECOVERY] Found ${stuckBooks.length} stuck storybook(s)`)

    const results: any[] = []

    for (const book of stuckBooks) {
      const scenes = Array.isArray(book.scenes) ? book.scenes : []
      const scenesWithImages = scenes.filter((s: any) => s.image_url)
      const totalScenes = book.total_scenes || 10
      const stuckSince = book.updated_at
      const isLongStuck = stuckSince < thirtyMinAgo

      console.log(`[RECOVERY] Storybook ${book.id} "${book.title}": ${scenesWithImages.length}/${totalScenes} scenes, stuck since ${stuckSince}`)

      // Check for duplicate scene numbers
      const sceneNumbers = scenesWithImages.map((s: any) => s.scene_number)
      const uniqueSceneNumbers = [...new Set(sceneNumbers)]
      const hasDuplicates = sceneNumbers.length !== uniqueSceneNumbers.length

      if (hasDuplicates) {
        console.log(`[RECOVERY] Found duplicate scene numbers: ${sceneNumbers.sort().join(', ')}`)
        // Deduplicate: keep the latest entry for each scene_number
        const deduped: any[] = []
        const seen = new Set<number>()
        // Iterate in reverse so later entries (potentially better) are kept
        for (let i = scenes.length - 1; i >= 0; i--) {
          const s = scenes[i]
          if (s.scene_number && !seen.has(s.scene_number)) {
            seen.add(s.scene_number)
            deduped.unshift(s)
          }
        }
        deduped.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))

        // Update the scenes array with deduplicated version
        await supabaseAdmin
          .from('storybooks')
          .update({ scenes: deduped, updated_at: new Date().toISOString() })
          .eq('id', book.id)

        console.log(`[RECOVERY] Deduplicated scenes: ${scenes.length} → ${deduped.length}`)
      }

      // After dedup, re-check completeness
      const effectiveScenes = hasDuplicates
        ? [...new Map(scenesWithImages.map((s: any) => [s.scene_number, s])).values()]
        : scenesWithImages
      const uniqueCompleted = effectiveScenes.length

      // Fetch template to get expected scene count
      let expectedTotal = totalScenes
      if (book.template_id) {
        const { data: template } = await supabaseAdmin
          .from('story_templates')
          .select('script_data')
          .eq('id', book.template_id)
          .single()

        if (template?.script_data?.scenes) {
          expectedTotal = template.script_data.scenes.length
        }
      }

      if (uniqueCompleted >= expectedTotal) {
        // All scenes present — mark as completed!
        console.log(`[RECOVERY] ✅ All ${uniqueCompleted}/${expectedTotal} scenes present. Marking as completed.`)

        // Build clean sorted scenes array
        const finalScenes = [...new Map(
          scenes
            .filter((s: any) => s.image_url)
            .map((s: any) => [s.scene_number, s])
        ).values()].sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))

        await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'completed',
            scenes: finalScenes,
            progress: 200,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', book.id)

        // Update generation job
        await supabaseAdmin
          .from('generation_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('storybook_id', book.id)

        results.push({ id: book.id, title: book.title, action: 'completed', scenes: uniqueCompleted })
      } else {
        // Some scenes missing — reset to 'pending' for the generation cron to retry
        const missingNumbers = Array.from({ length: expectedTotal }, (_, i) => i + 1)
          .filter(n => !effectiveScenes.find((s: any) => s.scene_number === n))

        console.log(`[RECOVERY] ⚠️ ${uniqueCompleted}/${expectedTotal} scenes. Missing: ${missingNumbers.join(', ')}. Resetting to pending.`)

        await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', book.id)

        results.push({ id: book.id, title: book.title, action: 'reset_to_pending', missing: missingNumbers })
      }

      // Send alert if stuck >30 minutes
      if (isLongStuck) {
        const alertBody = [
          `Storybook: ${book.title} (${book.id})`,
          `Character: ${book.character_name}`,
          `User: ${book.user_id}`,
          `Scenes: ${uniqueCompleted}/${expectedTotal}`,
          `Stuck since: ${stuckSince}`,
          `Action taken: ${uniqueCompleted >= expectedTotal ? 'Marked as completed' : 'Reset to pending for retry'}`,
        ].join('\n')

        await sendAlertEmail(
          `⚠️ Stuck Storybook: "${book.title}" (${uniqueCompleted}/${expectedTotal} scenes)`,
          alertBody
        )
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} stuck storybook(s)`,
      results,
    })
  } catch (error: any) {
    console.error('Recovery cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
