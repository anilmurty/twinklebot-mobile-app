import { Capacitor } from '@capacitor/core'

/**
 * Check if the app is running as a native mobile app (iOS/Android via Capacitor)
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Get the current platform: 'ios', 'android', or 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  try {
    const platform = Capacitor.getPlatform()
    if (platform === 'ios' || platform === 'android') return platform
    return 'web'
  } catch {
    return 'web'
  }
}
