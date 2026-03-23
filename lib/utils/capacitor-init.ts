import { Capacitor } from '@capacitor/core'
import { getPlatform } from '@/lib/utils/platform'

export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  // Status bar styling
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#FAFAF5' })
  } catch (err) {
    console.error('Failed to configure status bar:', err)
  }

  // RevenueCat initialization
  try {
    const platform = getPlatform()
    const apiKey = platform === 'ios'
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY

    if (apiKey) {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      await Purchases.configure({ apiKey })
      console.log(`RevenueCat configured for ${platform}`)
    }
  } catch (err) {
    console.error('Failed to configure RevenueCat:', err)
  }

  // Push notification registration
  try {
    const { initPushNotifications } = await import('@/lib/utils/push-notifications')
    await initPushNotifications()
    console.log('Push notifications initialized')
  } catch (err) {
    console.error('Failed to initialize push notifications:', err)
  }
}
