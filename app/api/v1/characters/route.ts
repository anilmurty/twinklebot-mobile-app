import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { normalizeCharacterName } from '@/lib/utils/update-storybook-names'

/**
 * GET /api/v1/characters
 * List all characters for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    
    const { data: characters, error } = await supabase
      .from('characters')
      .select(`
        id,
        name,
        front_photo_url,
        created_at,
        storybooks:storybooks(count)
      `)
      .eq('user_id', user.data.user?.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate signed URLs for character photos (always generate signed URLs for consistency)
    const { getSignedUrl } = await import('@/lib/supabase/storage')
    const formatted = await Promise.all(
      (characters || []).map(async (char: any) => {
        let photoUrl = char.front_photo_url
        
        // Always generate signed URL for character photos to ensure they're accessible
        if (photoUrl) {
          try {
            // Extract path from URL (handles both public and signed URLs)
            const urlMatch = photoUrl.match(/character-photos\/(.+)$/)
            if (urlMatch) {
              const path = urlMatch[1]
              photoUrl = await getSignedUrl('character-photos', path, 3600)
            } else if (photoUrl.includes('character-photos')) {
              // Fallback: try to extract path from full URL
              const urlObj = new URL(photoUrl)
              const pathParts = urlObj.pathname.split('/character-photos/')
              if (pathParts.length > 1) {
                photoUrl = await getSignedUrl('character-photos', pathParts[1], 3600)
              }
            }
          } catch (err) {
            console.error(`Failed to generate signed URL for character ${char.id}:`, err)
            // Keep original URL if signed URL generation fails
          }
        }

        return {
          id: char.id,
          name: char.name,
          front_photo_url: photoUrl,
          stories_count: char.storybooks?.[0]?.count || 0,
          created_at: char.created_at,
        }
      })
    )

    return NextResponse.json({ characters: formatted || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/characters
 * Create a new character
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, gender, photo_path } = body

    // Validation
    if (!name || name.length > 20 || !/^[a-zA-Z0-9]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Name must be 1-20 alphanumeric characters' },
        { status: 400 }
      )
    }

    // Normalize name: first letter uppercase, rest lowercase
    const normalizedName = normalizeCharacterName(name)

    if (!gender || !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender is required and must be "male" or "female"' },
        { status: 400 }
      )
    }

    if (!photo_path || typeof photo_path !== 'string') {
      return NextResponse.json(
        { error: 'Photo path is required' },
        { status: 400 }
      )
    }

    // Validate that photo_path is in the correct format and belongs to the user
    const userId = user.data.user?.id!
    if (!photo_path.startsWith(`${userId}/temp/`)) {
      return NextResponse.json(
        { error: 'Invalid photo path' },
        { status: 400 }
      )
    }

    const userEmail = user.data.user?.email || ''
    const supabase = createServerClient(request.headers.get('authorization'))
    const { supabaseAdmin } = await import('@/lib/supabase/server')

    // Ensure profile exists (create if doesn't exist)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Create profile for this user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: userEmail,
        })

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    }

    // Create character record first (names are no longer unique)
    const { data: character, error: createError } = await supabase
      .from('characters')
      .insert({
        user_id: userId,
        name: normalizedName,
        gender,
        front_photo_url: '', // Will update after moving file
        // left_photo_url and right_photo_url are nullable and not used
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Move photo from temp location to final location
    const { uploadToStorage, deleteFromStorage } = await import('@/lib/supabase/storage')
    
    // Download from temp location
    const { data: tempFile, error: downloadError } = await supabaseAdmin.storage
      .from('character-photos')
      .download(photo_path)

    if (downloadError || !tempFile) {
      return NextResponse.json(
        { error: `Failed to download photo: ${downloadError?.message || 'File not found'}` },
        { status: 500 }
      )
    }

    // Upload to final location
    const finalPath = `${userId}/${character.id}/front.jpg`
    const frontUrl = await uploadToStorage(
      'character-photos',
      finalPath,
      await tempFile.arrayBuffer(),
      tempFile.type || 'image/jpeg'
    )

    // Delete temp file
    await deleteFromStorage('character-photos', photo_path).catch((err) => {
      console.warn('Failed to delete temp file:', err)
      // Continue even if temp file deletion fails
    })

    // Update character with photo URL
    const { data: updatedCharacter, error: updateError } = await supabase
      .from('characters')
      .update({
        front_photo_url: frontUrl,
      })
      .eq('id', character.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedCharacter, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
