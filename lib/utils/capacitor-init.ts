import { Capacitor } from '@capacitor/core'

export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')
  await StatusBar.setStyle({ style: Style.Light })
  await StatusBar.setBackgroundColor({ color: '#FAFAF5' })
}
