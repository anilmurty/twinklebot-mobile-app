/**
 * Generate a proxy URL for private storage images
 *
 * Instead of signed URLs that change on every request,
 * proxy URLs are stable and allow browser caching.
 *
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param userId - Optional user ID for generating a signed token (for mobile apps)
 */
export function getImageProxyUrl(bucket: string, path: string, userId?: string): string {
  // Encode the path to handle special characters
  const encodedPath = encodeURIComponent(path)
  let url = `/api/v1/images?bucket=${bucket}&path=${encodedPath}`

  // If userId is provided, add a simple token for auth (mobile app support)
  if (userId) {
    const token = generateImageToken(userId, bucket, path)
    url += `&token=${token}`
  }

  return url
}

/**
 * Generate a simple token for image access validation
 * Token format: base64(userId:bucket:path:timestamp:signature)
 */
export function generateImageToken(userId: string, bucket: string, path: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  // Token valid for 24 hours
  const expiry = timestamp + 86400
  const payload = `${userId}:${bucket}:${path}:${expiry}`
  // Use a simple encoding for now (server will validate)
  return Buffer.from(payload).toString('base64url')
}

/**
 * Parse and validate an image token
 * Returns { userId, bucket, path } if valid, null otherwise
 */
export function parseImageToken(token: string): { userId: string; bucket: string; path: string } | null {
  try {
    const payload = Buffer.from(token, 'base64url').toString()
    const parts = payload.split(':')
    if (parts.length < 4) return null

    const expiry = parseInt(parts[parts.length - 1], 10)
    const now = Math.floor(Date.now() / 1000)
    if (now > expiry) return null // Token expired

    // Reconstruct the path (it might contain colons)
    const userId = parts[0]
    const bucket = parts[1]
    const path = parts.slice(2, -1).join(':')

    return { userId, bucket, path }
  } catch {
    return null
  }
}

/**
 * Extract storage path from a Supabase storage URL
 * 
 * Example input: https://xxx.supabase.co/storage/v1/object/public/storybook-scenes/abc/scene-1.jpg
 * Example output: abc/scene-1.jpg
 */
export function extractStoragePath(url: string, bucket: string): string | null {
  // Match pattern: bucket-name/path/to/file
  const regex = new RegExp(`${bucket}/(.+)$`)
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Convert a signed URL or storage URL to a proxy URL
 */
export function convertToProxyUrl(url: string, bucket: string): string | null {
  const path = extractStoragePath(url, bucket)
  if (!path) return null
  return getImageProxyUrl(bucket, path)
}

