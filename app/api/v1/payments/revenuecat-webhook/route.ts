import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateStorybook } from '@/lib/services/storybook-generator'

/** Map RevenueCat product IDs to story credit counts */
const PRODUCT_CREDITS: Record<string, number> = {
  'com.twinklebot.story.single': 1,
  'com.twinklebot.story.bundle2': 2,
  'com.twinklebot.story.bundle3': 3,
  'com.twinklebot.story.bundle4': 4,
}

/**
 * POST /api/v1/payments/revenuecat-webhook
 * Handle RevenueCat webhook events for iOS/Android IAP
 *
 * RevenueCat sends events like INITIAL_PURCHASE, RENEWAL, etc.
 * We only need to handle INITIAL_PURCHASE for one-time consumables.
 *
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook authorization
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      console.error('RevenueCat webhook: invalid authorization')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const event = body.event

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    console.log(`RevenueCat webhook: ${event.type} for user ${event.app_user_id}`)

    // Only process initial purchases (not renewals, cancellations, etc.)
    if (event.type !== 'INITIAL_PURCHASE' && event.type !== 'NON_RENEWING_PURCHASE') {
      return NextResponse.json({ received: true })
    }

    const userId = event.app_user_id
    const productId = event.product_id

    if (!userId || !productId) {
      console.error('RevenueCat webhook: missing user_id or product_id')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine credits from product ID
    const creditsToAdd = PRODUCT_CREDITS[productId] || 1

    // Add credits to user's profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('story_credits')
      .eq('id', userId)
      .single()

    if (!profile) {
      console.error(`RevenueCat webhook: user ${userId} not found`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentCredits = profile.story_credits || 0
    const newCredits = currentCredits + creditsToAdd

    await supabaseAdmin
      .from('profiles')
      .update({
        story_credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    console.log(
      `RevenueCat: Added ${creditsToAdd} credits to user ${userId} ` +
      `(product: ${productId}), total: ${newCredits}`
    )

    // Check if there's a pending storybook that should be generated
    // (user purchased from the preview flow — the most recent preview_pending storybook)
    const { data: pendingStorybook } = await supabaseAdmin
      .from('storybooks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'preview_pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (pendingStorybook) {
      // Use one credit and start generation
      await supabaseAdmin
        .from('profiles')
        .update({
          story_credits: Math.max(0, newCredits - 1),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      await supabaseAdmin
        .from('storybooks')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pendingStorybook.id)

      try {
        await generateStorybook(pendingStorybook.id)
        console.log(`RevenueCat: Started generation for storybook ${pendingStorybook.id}`)
      } catch (err: any) {
        console.error(`RevenueCat: Failed to generate storybook ${pendingStorybook.id}:`, err)
        await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'failed',
            error_message: `Failed to resume generation: ${err.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingStorybook.id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('RevenueCat webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
