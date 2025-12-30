import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

/**
 * GET /api/v1/characters/:id
 * Get character details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params
    
    const { data: character, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.data.user?.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(character)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/characters/:id
 * Update character (name and/or photos)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params
    
    // Check ownership
    const { data: existing } = await supabase
      .from('characters')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string | null
    const frontPhoto = formData.get('front_photo') as File | null

    const updates: any = {}

    // Update name if provided
    if (name) {
      if (name.length > 20 || !/^[a-zA-Z0-9]+$/.test(name)) {
        return NextResponse.json(
          { error: 'Name must be 1-20 alphanumeric characters' },
          { status: 400 }
        )
      }

      // Check if name already exists (excluding current character)
      const { data: nameExists } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.data.user?.id)
        .eq('name', name)
        .neq('id', id)
        .single()

      if (nameExists) {
        return NextResponse.json(
          { error: 'Character name already exists' },
          { status: 409 }
        )
      }

      updates.name = name
    }

    // Upload new photo if provided (only front photo is supported)
    const { uploadToStorage } = await import('@/lib/supabase/storage')
    const userId = user.data.user?.id!

    if (frontPhoto) {
      updates.front_photo_url = await uploadToStorage(
        'character-photos',
        `${userId}/${id}/front.jpg`,
        await frontPhoto.arrayBuffer(),
        frontPhoto.type
      )
    }

    // Update character
    const { data: updatedCharacter, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedCharacter)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/characters/:id
 * Delete character
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient(request.headers.get('authorization'))
    const { id } = 'then' in params ? await params : params
    
    // Check ownership
    const { data: character } = await supabase
      .from('characters')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (!character || character.user_id !== user.data.user?.id) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Delete photo from storage (only front photo is used)
    const { deleteFromStorage } = await import('@/lib/supabase/storage')
    const userId = user.data.user?.id!

    await deleteFromStorage('character-photos', `${userId}/${id}/front.jpg`).catch(() => {
      // Continue even if storage deletion fails
    })

    // Delete character (cascade will handle storybooks)
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

