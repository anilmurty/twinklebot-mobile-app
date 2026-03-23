/**
 * Apple Push Notification Service (APNS) - sends notifications to iOS devices.
 * Gracefully degrades when credentials are not configured.
 *
 * Required env vars:
 *   APNS_KEY_ID       – 10-char Key ID from Apple Developer > Keys
 *   APNS_TEAM_ID      – 10-char Team ID from Apple Developer
 *   APNS_KEY_CONTENT   – contents of the .p8 file (PEM string, can be base64-encoded)
 *   APNS_BUNDLE_ID     – app bundle ID (default: com.twinklebot.app)
 *   APNS_ENVIRONMENT   – 'production' or 'sandbox' (default: production)
 */

import { supabaseAdmin } from '@/lib/supabase/server'

// ---- APNS HTTP/2 client (lazy-loaded) ----

let apnsClient: any = null

function isApnsConfigured(): boolean {
  return !!(
    process.env.APNS_KEY_ID &&
    process.env.APNS_TEAM_ID &&
    process.env.APNS_KEY_CONTENT
  )
}

async function getApnsClient() {
  if (apnsClient) return apnsClient

  const { APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_CONTENT, APNS_ENVIRONMENT } = process.env

  // Decode key content — support both raw PEM and base64-encoded
  let keyContent = APNS_KEY_CONTENT!
  if (!keyContent.includes('BEGIN PRIVATE KEY')) {
    // Assume base64
    keyContent = Buffer.from(keyContent, 'base64').toString('utf-8')
  }

  const { default: APNS, Notification, Errors } = await import('apns2')
  apnsClient = new APNS({
    team: APNS_TEAM_ID!,
    keyId: APNS_KEY_ID!,
    signingKey: keyContent,
    defaultTopic: process.env.APNS_BUNDLE_ID || 'com.twinklebot.app',
    host: APNS_ENVIRONMENT === 'sandbox'
      ? 'https://api.sandbox.push.apple.com'
      : 'https://api.push.apple.com',
  })

  return apnsClient
}

/**
 * Send a push notification to all of a user's registered iOS devices.
 * Best-effort: never throws, never blocks the caller.
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!isApnsConfigured()) {
    console.log('[APNS] Not configured — skipping notification')
    return
  }

  try {
    // Fetch all device tokens for this user
    const { data: tokens, error } = await supabaseAdmin
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', userId)

    if (error) {
      console.error('[APNS] Failed to fetch device tokens:', error.message)
      return
    }

    if (!tokens || tokens.length === 0) {
      console.log(`[APNS] No device tokens for user ${userId}`)
      return
    }

    const client = await getApnsClient()
    const { Notification } = await import('apns2')

    const staleTokenIds: string[] = []

    for (const { id, token } of tokens) {
      try {
        const notification = new Notification(token, {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
          },
          ...data,
        })

        await client.send(notification)
        console.log(`[APNS] Sent to token ${token.substring(0, 8)}...`)
      } catch (err: any) {
        const reason = err?.reason || err?.message || ''
        console.error(`[APNS] Failed to send to token ${token.substring(0, 8)}...: ${reason}`)

        // Clean up invalid/expired tokens
        if (
          reason === 'BadDeviceToken' ||
          reason === 'Unregistered' ||
          reason === 'ExpiredProviderToken' ||
          err?.statusCode === 410
        ) {
          staleTokenIds.push(id)
        }
      }
    }

    // Remove stale tokens
    if (staleTokenIds.length > 0) {
      console.log(`[APNS] Cleaning up ${staleTokenIds.length} stale token(s)`)
      await supabaseAdmin
        .from('device_tokens')
        .delete()
        .in('id', staleTokenIds)
    }
  } catch (err: any) {
    console.error('[APNS] Unexpected error:', err.message)
  }
}
