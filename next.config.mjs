/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0',
    NEXT_PUBLIC_GIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || 'dev',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'auth.twinklebot.app',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  async rewrites() {
    // First-party proxy for Google Analytics so Safari ITP doesn't block
    // gtag.js as a known third-party tracker. Without this, ~90% of Safari
    // sessions emit zero analytics events.
    return [
      {
        source: '/_ga/gtag.js',
        destination: 'https://www.googletagmanager.com/gtag/js?id=G-J60V4T7WKW',
      },
      {
        source: '/_ga/:path*',
        destination: 'https://www.google-analytics.com/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
