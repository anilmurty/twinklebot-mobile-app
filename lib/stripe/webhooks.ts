/**
 * Stripe webhook handling
 */

import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from './client'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateStorybook } from '@/lib/services/storybook-generator'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
}

/**
 * Verify webhook signature and parse event
 */
export async function verifyWebhook(
  request: NextRequest
): Promise<Stripe.Event | null> {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    return event
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return null
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  if (!session.metadata?.storybook_id) {
    console.error('Missing storybook_id in checkout session metadata')
    return
  }

  const storybookId = session.metadata.storybook_id
  const planId = session.metadata.plan_id
  const couponCode = session.metadata.coupon_code

  // Update storybook payment status
  const updateData: any = {
    payment_status: 'completed',
    stripe_checkout_session_id: session.id,
    updated_at: new Date().toISOString(),
  }

  if (planId) {
    updateData.stripe_price_id = planId
  }

  if (couponCode) {
    updateData.stripe_coupon_code = couponCode
  }

  await supabaseAdmin
    .from('storybooks')
    .update(updateData)
    .eq('id', storybookId)

  // If subscription, create/update subscription record
  if (session.mode === 'subscription' && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
      {
        expand: ['items.data.price.product'],
      }
    )

    // Get plan from database
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('stripe_price_id', subscription.items.data[0].price.id)
      .single()

    if (plan) {
      // Check if subscription already exists
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      const subscriptionData = {
        user_id: session.metadata.user_id,
        subscription_plan_id: plan.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: subscription.status === 'active' ? 'active' : subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        stories_used_this_period: 0,
        updated_at: new Date().toISOString(),
      }

      if (existingSubscription) {
        await supabaseAdmin
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
      } else {
        await supabaseAdmin.from('subscriptions').insert(subscriptionData)
      }
    }
  }

  // Resume storybook generation
  try {
    await generateStorybook(storybookId)
  } catch (error: any) {
    console.error(`Failed to resume generation for storybook ${storybookId}:`, error)
    // Update storybook status to failed
    await supabaseAdmin
      .from('storybooks')
      .update({
        status: 'failed',
        error_message: `Failed to resume generation: ${error.message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storybookId)
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription

  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSubscription) {
    return // Subscription not found, might be handled by checkout.session.completed
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status === 'active' ? 'active' : subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSubscription.id)
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

/**
 * Handle webhook event
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}

