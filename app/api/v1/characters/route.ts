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

    // Format response
    const formatted = characters?.map((char: any) => ({
      id: char.id,
      name: char.name,
      front_photo_url: char.front_photo_url,
      stories_count: char.storybooks?.[0]?.count || 0,
      created_at: char.created_at,
    }))

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
    const leftPhoto = formData.get('left_photo') as File
    const rightPhoto = formData.get('right_photo') as File

    // Validation
    if (!name || name.length > 20 || !/^[a-zA-Z0-9]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Name must be 1-20 alphanumeric characters' },
        { status: 400 }
      )
    }

    if (!frontPhoto || !leftPhoto || !rightPhoto) {
      return NextResponse.json(
        { error: 'All three photos are required' },
        { status: 400 }
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
        left_photo_url: '',
        right_photo_url: '',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Upload photos to storage
    const { uploadToStorage } = await import('@/lib/supabase/storage')
    
    const [frontUrl, leftUrl, rightUrl] = await Promise.all([
      uploadToStorage(
        'character-photos',
        `${userId}/${character.id}/front.jpg`,
        await frontPhoto.arrayBuffer(),
        frontPhoto.type
      ),
      uploadToStorage(
        'character-photos',
        `${userId}/${character.id}/left.jpg`,
        await leftPhoto.arrayBuffer(),
        leftPhoto.type
      ),
      uploadToStorage(
        'character-photos',
        `${userId}/${character.id}/right.jpg`,
        await rightPhoto.arrayBuffer(),
        rightPhoto.type
      ),
    ])

    // Update character with photo URLs
    const { data: updatedCharacter, error: updateError } = await supabase
      .from('characters')
      .update({
        front_photo_url: frontUrl,
        left_photo_url: leftUrl,
        right_photo_url: rightUrl,
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

