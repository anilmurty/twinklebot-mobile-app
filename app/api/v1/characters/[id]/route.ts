import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { normalizeCharacterName, updateStorybooksForCharacter } from '@/lib/utils/update-storybook-names'

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

      // Normalize name: first letter uppercase, rest lowercase
      const normalizedName = normalizeCharacterName(name)
      
      // Get current character name before updating
      const { data: currentCharacter } = await supabase
        .from('characters')
        .select('name')
        .eq('id', id)
        .single()

      const oldName = currentCharacter?.name || ''
      
      // Only update if name actually changed
      if (normalizedName !== oldName) {
        updates.name = normalizedName

        // Update all storybooks that use this character
        try {
          const { updated, errors } = await updateStorybooksForCharacter(
            id,
            oldName,
            normalizedName
          )
          
          if (errors.length > 0) {
            console.error('Errors updating storybooks:', errors)
            // Continue with character update even if some storybooks failed
          }
          
          console.log(`Updated ${updated} storybook(s) for character ${id}`)
        } catch (err: any) {
          console.error('Failed to update storybooks:', err)
          // Continue with character update even if storybook update fails
        }
      }
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
    const { supabaseAdmin } = await import('@/lib/supabase/server')
    const userId = user.data.user?.id!

    // Delete front photo from storage
    await deleteFromStorage('character-photos', `${userId}/${id}/front.jpg`).catch((err) => {
      console.error(`Failed to delete character photo:`, err)
    })

    // Delete all character variations for this character (across all templates)
    // First, get all character variations for this character
    const { data: variations, error: variationsError } = await supabaseAdmin
      .from('character_variations')
      .select('template_id, front_variation_url, left_variation_url, right_variation_url')
      .eq('character_id', id)

    if (!variationsError && variations && variations.length > 0) {
      console.log(`Found ${variations.length} character variation(s) to delete for character ${id}`)
      
      // Delete each variation's files from storage
      for (const variation of variations) {
        const storagePath = `${userId}/${id}/${variation.template_id}`
        await Promise.all([
          deleteFromStorage('character-variations', `${storagePath}/front.jpg`).catch((err) => {
            console.error(`Failed to delete front variation for template ${variation.template_id}:`, err)
          }),
          deleteFromStorage('character-variations', `${storagePath}/left.jpg`).catch((err) => {
            console.error(`Failed to delete left variation for template ${variation.template_id}:`, err)
          }),
          deleteFromStorage('character-variations', `${storagePath}/right.jpg`).catch((err) => {
            console.error(`Failed to delete right variation for template ${variation.template_id}:`, err)
          }),
        ])
      }

      // Delete all character variations from database
      const { error: deleteVariationsError } = await supabaseAdmin
        .from('character_variations')
        .delete()
        .eq('character_id', id)

      if (deleteVariationsError) {
        console.error(`Failed to delete character variations from database:`, deleteVariationsError)
      } else {
        console.log(`✅ Deleted ${variations.length} character variation(s) from database`)
      }
    }

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
