import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Image Proxy API
 *
 * Serves private storage images with browser caching.
 * This solves the problem of signed URLs changing on every request,
 * which prevents browser caching.
 *
 * GET /api/v1/images?bucket=storybook-scenes&path=abc/scene-1.jpg
 *
 * Features:
 * - Validates user owns the resource before serving
 * - Returns stable URLs that browsers can cache
 * - Sets Cache-Control: private, max-age=3600 (1 hour cache)
 * - Supports both header-based and cookie-based auth (for img tags)
 */

// Bucket to ownership validation mapping
const BUCKET_VALIDATORS: Record<string, (userId: string, path: string) => Promise<boolean>> = {
  'storybook-scenes': validateStorybookOwnership,
  'character-photos': validateCharacterOwnership,
  'character-variations': validateCharacterOwnership,
}

/**
 * Get user from cookies (for img tag requests that don't send auth headers)
 */
async function getAuthUserFromCookies(request: NextRequest): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  // Supabase stores auth in cookies like: sb-<project-ref>-auth-token
  // The cookie contains a JSON array [access_token, refresh_token, ...]
  const cookies = cookieHeader.split(';').map(c => c.trim())

  for (const cookie of cookies) {
    if (cookie.startsWith('sb-') && cookie.includes('-auth-token=')) {
      try {
        const [, value] = cookie.split('=')
        const decoded = decodeURIComponent(value)
        const parsed = JSON.parse(decoded)
        const accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token

        if (accessToken) {
          // Verify the token
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

          if (!supabaseUrl || !supabaseAnonKey) return null

          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          })

          const { data, error } = await supabase.auth.getUser()
          if (!error && data.user) {
            return data.user.id
          }
        }
      } catch (e) {
        // Cookie parsing failed, continue checking other cookies
      }
    }
  }

  return null
}

/**
 * Validate user owns the storybook
 * Path format: {storybookId}/scene-{number}.jpg or {storybookId}/thumbnail.jpg
 */
async function validateStorybookOwnership(userId: string, path: string): Promise<boolean> {
  const storybookId = path.split('/')[0]
  if (!storybookId) return false

  const { data, error } = await supabaseAdmin
    .from('storybooks')
    .select('id')
    .eq('id', storybookId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

/**
 * Validate user owns the character
 * Path format: {userId}/{characterId}/... or {userId}/{characterId}/{templateId}/...
 */
async function validateCharacterOwnership(userId: string, path: string): Promise<boolean> {
  const pathParts = path.split('/')
  // For character-photos: {userId}/{characterId}/front.jpg
  // For character-variations: {userId}/{characterId}/{templateId}/front.jpg
  if (pathParts.length < 2) return false
  
  const pathUserId = pathParts[0]
  const characterId = pathParts[1]
  
  // First check: path user ID should match authenticated user
  if (pathUserId !== userId) return false
  
  // Second check: verify character belongs to user
  const { data, error } = await supabaseAdmin
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')

    console.log('Image proxy request:', { bucket, path })

    // Validate required parameters
    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Missing required parameters: bucket and path' },
        { status: 400 }
      )
    }

    // Check if bucket is supported
    const validator = BUCKET_VALIDATORS[bucket]
    if (!validator) {
      return NextResponse.json(
        { error: `Unsupported bucket: ${bucket}` },
        { status: 400 }
      )
    }

    // Authenticate user - try multiple methods
    let userId: string | null = null
    let authMethod: string = 'none'

    // Method 1: Authorization header (for API calls)
    const user = await getAuthUser(request)
    if (user?.data.user?.id) {
      userId = user.data.user.id
      authMethod = 'header'
    }

    // Method 2: URL token (for mobile app img tags)
    if (!userId) {
      const token = searchParams.get('token')
      if (token) {
        const { parseImageToken } = await import('@/lib/utils/image-proxy')
        const tokenData = parseImageToken(token)
        if (tokenData && tokenData.bucket === bucket && tokenData.path === path) {
          userId = tokenData.userId
          authMethod = 'token'
        }
      }
    }

    // Method 3: Cookies (for browser img tags)
    if (!userId) {
      userId = await getAuthUserFromCookies(request)
      if (userId) authMethod = 'cookie'
    }

    console.log('Image proxy auth:', { authMethod, hasUserId: !!userId, bucket, path: path?.substring(0, 50) })

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ownership
    const isOwner = await validator(userId, path)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the image from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error(`Failed to download image: ${bucket}/${path}`, error)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Determine content type from file extension
    const extension = path.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    }
    const contentType = contentTypes[extension || ''] || 'image/jpeg'

    // Convert blob to buffer
    const buffer = await data.arrayBuffer()

    // Return image with caching headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        // Private cache (not CDN) for 1 hour
        // Browser will reuse this without hitting the server
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
        // ETag for conditional requests (allows 304 responses)
        'ETag': `"${bucket}-${path}-${Date.now()}"`,
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

