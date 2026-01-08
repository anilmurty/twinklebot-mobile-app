/**
 * Utility function to update character names in storybooks when a character is renamed
 */

import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Normalize character name: first letter uppercase, rest lowercase
 */
export function normalizeCharacterName(name: string): string {
  if (!name || name.length === 0) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

/**
 * Replace character name in text, handling various formats
 * Replaces: [Name], [NAME], {character_name}, and the actual name
 */
function replaceCharacterNameInText(
  text: string,
  oldName: string,
  newName: string
): string {
  if (!text) return text

  // Normalize names for comparison
  const normalizedOldName = normalizeCharacterName(oldName)
  const normalizedNewName = normalizeCharacterName(newName)

  // Replace placeholders first
  let updated = text
    .replace(/\[Name\]/g, normalizedNewName)
    .replace(/\[NAME\]/g, normalizedNewName)
    .replace(/{character_name}/g, normalizedNewName)

  // Replace actual name occurrences (case-insensitive word boundary match)
  // This handles cases where the name appears in the text
  const nameRegex = new RegExp(`\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  updated = updated.replace(nameRegex, normalizedNewName)

  return updated
}

/**
 * Update all storybooks that use a specific character
 * Updates both the character_name field and the scenes JSONB data
 */
export async function updateStorybooksForCharacter(
  characterId: string,
  oldName: string,
  newName: string
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = []
  let updated = 0

  try {
    // Get all storybooks for this character
    const { data: storybooks, error: fetchError } = await supabaseAdmin
      .from('storybooks')
      .select('id, character_name, scenes')
      .eq('character_id', characterId)

    if (fetchError) {
      throw new Error(`Failed to fetch storybooks: ${fetchError.message}`)
    }

    if (!storybooks || storybooks.length === 0) {
      return { updated: 0, errors: [] }
    }

    const normalizedNewName = normalizeCharacterName(newName)

    // Update each storybook
    for (const storybook of storybooks) {
      try {
        const updates: any = {
          character_name: normalizedNewName,
        }

        // Update scenes if they exist
        if (storybook.scenes && Array.isArray(storybook.scenes)) {
          const updatedScenes = storybook.scenes.map((scene: any) => {
            const updatedScene = { ...scene }

            // Update headline if it contains the character name
            if (scene.headline) {
              updatedScene.headline = replaceCharacterNameInText(
                scene.headline,
                oldName,
                newName
              )
            }

            // Update script_text if it exists
            if (scene.script_text) {
              updatedScene.script_text = replaceCharacterNameInText(
                scene.script_text,
                oldName,
                newName
              )
            }

            // Update text if it exists (alternative field name)
            if (scene.text) {
              updatedScene.text = replaceCharacterNameInText(
                scene.text,
                oldName,
                newName
              )
            }

            return updatedScene
          })

          updates.scenes = updatedScenes
        }

        // Update the storybook
        const { error: updateError } = await supabaseAdmin
          .from('storybooks')
          .update(updates)
          .eq('id', storybook.id)

        if (updateError) {
          errors.push(`Failed to update storybook ${storybook.id}: ${updateError.message}`)
        } else {
          updated++
        }
      } catch (err: any) {
        errors.push(`Error updating storybook ${storybook.id}: ${err.message}`)
      }
    }

    return { updated, errors }
  } catch (error: any) {
    throw new Error(`Failed to update storybooks: ${error.message}`)
  }
}

