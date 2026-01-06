/**
 * Stripe client initialization and helper functions
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

/**
 * Create a checkout session for one-time payment or subscription
 */
export async function createCheckoutSession(params: {
  priceId: string
  customerId?: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  couponId?: string
  mode?: 'payment' | 'subscription'
}): Promise<Stripe.Checkout.Session> {
  const {
    priceId,
    customerId,
    customerEmail,
    successUrl,
    cancelUrl,
    metadata = {},
    couponId,
    mode = 'payment', // Default to one-time payment
  } = params

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  }

  // Add customer if provided
  if (customerId) {
    sessionParams.customer = customerId
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail
  }

  // Add coupon if provided
  if (couponId) {
    sessionParams.discounts = [
      {
        coupon: couponId,
      },
    ]
  }

  // For subscriptions, set payment collection
  if (mode === 'subscription') {
    sessionParams.payment_method_collection = 'always'
    sessionParams.subscription_data = {
      metadata,
    }
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(couponCode: string): Promise<{
  valid: boolean
  coupon?: Stripe.Coupon
  error?: string
}> {
  try {
    const coupon = await stripe.coupons.retrieve(couponCode, {
      expand: [],
    })

    // Check if coupon is valid
    if (coupon.valid) {
      return {
        valid: true,
        coupon,
      }
    } else {
      return {
        valid: false,
        error: 'Coupon is not valid',
      }
    }
  } catch (error: any) {
    if (error.code === 'resource_missing') {
      return {
        valid: false,
        error: 'Coupon not found',
      }
    }
    return {
      valid: false,
      error: error.message || 'Failed to validate coupon',
    }
  }
}

/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateCustomer(
  email: string,
  userId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // Try to find existing customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (customers.data.length > 0) {
    return customers.data[0]
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    metadata: {
      user_id: userId,
      ...metadata,
    },
  })
}

