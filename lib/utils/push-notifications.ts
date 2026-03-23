/**
 * Client-side push notification setup for Capacitor (iOS).
 * Requests permission, registers the device token, and handles notification taps.
 */

import { Capacitor } from '@capacitor/core'

export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  // Check current permission status
  const permStatus = await PushNotifications.checkPermissions()

  if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
    const result = await PushNotifications.requestPermissions()
    if (result.receive !== 'granted') {
      console.log('[PUSH] Permission denied')
      return
    }
  } else if (permStatus.receive !== 'granted') {
    console.log('[PUSH] Permission not granted:', permStatus.receive)
    return
  }

  // Register with APNS
  await PushNotifications.register()

  // Handle successful registration — send token to backend
  PushNotifications.addListener('registration', async (token) => {
    console.log('[PUSH] Registered with token:', token.value.substring(0, 8) + '...')
    try {
      const { createClient } = await import('@/lib/supabase/client-browser')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('[PUSH] No auth session, skipping token registration')
        return
      }

      await fetch('/api/v1/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token: token.value,
          platform: 'ios',
        }),
      })
      console.log('[PUSH] Token registered with backend')
    } catch (err) {
      console.error('[PUSH] Failed to register token:', err)
    }
  })

  // Handle registration failure
  PushNotifications.addListener('registrationError', (err) => {
    console.error('[PUSH] Registration failed:', err)
  })

  // Handle foreground notifications — show a toast
  PushNotifications.addListener('pushNotificationReceived', async (notification) => {
    console.log('[PUSH] Foreground notification:', notification)
    try {
      const { toast } = await import('sonner')
      toast(notification.title || 'Notification', {
        description: notification.body,
      })
    } catch {
      // sonner not available in this context
    }
  })

  // Handle notification tap — deep link to storybook
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[PUSH] Notification tapped:', action)
    const data = action.notification.data
    if (data?.storybookId) {
      if (data.type === 'preview_ready') {
        window.location.href = '/app?tab=storybooks'
      } else {
        window.location.href = `/storybook/${data.storybookId}`
      }
    }
  })
}
