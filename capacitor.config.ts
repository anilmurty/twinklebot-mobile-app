import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.twinklebot.app',
  appName: 'Twinklebot',
  webDir: 'public',
  server: {
    url: 'https://www.twinklebot.com',
    cleartext: false,
  },
}

export default config
