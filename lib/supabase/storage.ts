import { supabaseAdmin } from './server'

/**
 * Upload file to Supabase Storage
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: File | ArrayBuffer | Buffer | Blob,
  contentType?: string
): Promise<string> {
  // Convert ArrayBuffer to Blob if needed
  let fileToUpload: File | Blob
  if (file instanceof ArrayBuffer) {
    fileToUpload = new Blob([file], { type: contentType })
  } else if (Buffer.isBuffer(file)) {
    fileToUpload = new Blob([file], { type: contentType })
  } else {
    fileToUpload = file
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, fileToUpload, {
      contentType,
      upsert: true,
    })

  if (error) {
    throw new Error(`Storage upload error: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Storage delete error: ${error.message}`)
  }
}

/**
 * Get public URL for a storage file
 */
export function getStorageUrl(bucket: string, path: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get a Supabase image transform URL for optimized delivery.
 * Requires Supabase Pro plan. Serves resized WebP images via Supabase CDN.
 *
 * @param bucket - Public bucket name
 * @param path - File path within the bucket
 * @param options - Transform options (width, quality, format)
 */
export function getTransformedImageUrl(
  bucket: string,
  path: string,
  options: { width?: number; quality?: number; resize?: string } = {}
): string {
  const { width = 400, quality = 75, resize = 'contain' } = options
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path, {
    transform: { width, quality, resize: resize as any },
  })
  return data.publicUrl
}

/**
 * Get signed URL for a private storage file (expires in specified seconds)
 * Use this for files that need to be accessed by external services like Replicate
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}
