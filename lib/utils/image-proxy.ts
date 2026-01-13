/**
 * Generate a proxy URL for private storage images
 * 
 * Instead of signed URLs that change on every request,
 * proxy URLs are stable and allow browser caching.
 */
export function getImageProxyUrl(bucket: string, path: string): string {
  // Encode the path to handle special characters
  const encodedPath = encodeURIComponent(path)
  return `/api/v1/images?bucket=${bucket}&path=${encodedPath}`
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

