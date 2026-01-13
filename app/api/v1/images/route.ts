import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { supabaseAdmin } from '@/lib/supabase/server'

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
 * - Supports optional width parameter for resizing (future)
 */

// Bucket to ownership validation mapping
const BUCKET_VALIDATORS: Record<string, (userId: string, path: string) => Promise<boolean>> = {
  'storybook-scenes': validateStorybookOwnership,
  'character-photos': validateCharacterOwnership,
  'character-variations': validateCharacterOwnership,
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

    // Authenticate user
    const user = await getAuthUser(request)
    if (!user || !user.data.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.data.user.id

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

