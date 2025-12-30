import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

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

    const formData = await request.formData()
    const name = formData.get('name') as string
    const frontPhoto = formData.get('front_photo') as File

    // Validation
    if (!name || name.length > 20 || !/^[a-zA-Z0-9]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Name must be 1-20 alphanumeric characters' },
        { status: 400 }
      )
    }

    if (!frontPhoto) {
      return NextResponse.json(
        { error: 'Photo is required' },
        { status: 400 }
      )
    }

    // Validate file size
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
    if (frontPhoto.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Photo is too large. Maximum size is 10MB. Please compress or resize your image.' },
        { status: 413 }
      )
    }

    const userId = user.data.user?.id!
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

    // Check if character name already exists for this user
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Character name already exists' },
        { status: 409 }
      )
    }

    // Create character record first
    const { data: character, error: createError } = await supabase
      .from('characters')
      .insert({
        user_id: userId,
        name,
        front_photo_url: '', // Will update after upload
        // left_photo_url and right_photo_url are nullable and not used
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Upload photo to storage
    const { uploadToStorage } = await import('@/lib/supabase/storage')
    
    // Upload the single photo as front.jpg
    const frontUrl = await uploadToStorage(
      'character-photos',
      `${userId}/${character.id}/front.jpg`,
      await frontPhoto.arrayBuffer(),
      frontPhoto.type
    )

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

