import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook, handleWebhookEvent } from '@/lib/stripe/webhooks'

/**
 * POST /api/v1/payments/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

