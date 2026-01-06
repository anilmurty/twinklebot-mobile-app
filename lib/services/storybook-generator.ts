/**
 * Storybook generation service
 */

import { supabaseAdmin } from '@/lib/supabase/server'
import { generateImageWithBasePhotoAndCharacter } from './image-generation'
import { uploadToStorage } from '@/lib/supabase/storage'
import {
  getCharacterVariations,
  generateCharacterVariations,
} from './character-variation-generator'

interface SceneTemplate {
  scene_number: number
  headline?: string
  script_text: string
  base_photo: string // filename from Supabase Storage (story-template-assets/day-at-the-zoo/)
  child_photo: 'front' | 'left' | 'right' // which character variation to use
  insertion_prompt: string // scene-specific insertion instructions
  aspect_ratio?: string
}

export async function generateStorybook(storybookId: string): Promise<void> {
  const startTime = Date.now()
  console.log(`[TIMING] Storybook generation started at ${new Date().toISOString()}`)
  
  // Get storybook with related data
  const fetchStart = Date.now()
  const { data: storybook, error: sbError } = await supabaseAdmin
    .from('storybooks')
    .select(`
      *,
      character:characters(*),
      template:story_templates(*)
    `)
    .eq('id', storybookId)
    .single()
  console.log(`[TIMING] Fetched storybook data: ${Date.now() - fetchStart}ms`)

  if (sbError || !storybook) {
    throw new Error(`Storybook not found: ${storybookId}`)
  }

  // Check if already completed
  if (storybook.status === 'completed') {
    return
  }

  // Check if resuming from preview_pending
  const isResumingFromPreview = storybook.status === 'preview_pending'
  const existingScenes = Array.isArray(storybook.scenes) ? storybook.scenes : []
  const hasPreviewScene = existingScenes.length > 0 && existingScenes[0]?.image_url

  // Update status to generating
  const statusUpdateStart = Date.now()
  await supabaseAdmin
    .from('storybooks')
    .update({ status: 'generating' })
    .eq('id', storybookId)
  console.log(`[TIMING] Updated status to generating: ${Date.now() - statusUpdateStart}ms`)

  if (isResumingFromPreview) {
    console.log(`[RESUME] Resuming generation from preview state`)
    console.log(`[RESUME] Preview scene exists: ${hasPreviewScene}`)
  }

  const character = storybook.character
  const template = storybook.template

  if (!character || !template) {
    throw new Error('Missing character or template data')
  }

    const userId = storybook.user_id
    const scenes = template.script_data.scenes as SceneTemplate[]
    const totalScenes = scenes.length
    
    console.log(`\n=== STORYBOOK GENERATION START ===`)
    console.log(`Storybook ID: ${storybookId}`)
    console.log(`Character: ${character.name}`)
    console.log(`Template: ${template.title}`)
    console.log(`Total scenes expected: ${totalScenes}`)
    console.log(`Scene numbers:`, scenes.map(s => s.scene_number).sort((a, b) => a - b))
    if (isResumingFromPreview) {
      console.log(`[RESUME] Resuming from preview - will skip first scene if already generated`)
    }

  try {
    // Check for existing character variations, generate if needed
    console.log(`\n=== CHECKING CHARACTER VARIATIONS ===`)
    console.log(`Character ID: ${character.id}`)
    console.log(`Template ID: ${template.id}`)
    const variationCheckStart = Date.now()
    let variations = await getCharacterVariations(character.id, template.id)
    console.log(`[TIMING] Checked for existing variations: ${Date.now() - variationCheckStart}ms`)
  
    if (!variations) {
      console.log(`No existing variations found. Generating character variations...`)
      try {
        // Set progress to 10% - "Starting character creation"
        const progressUpdateStart = Date.now()
        await supabaseAdmin
          .from('storybooks')
          .update({ progress: 10, updated_at: new Date().toISOString() })
          .eq('id', storybookId)
        console.log(`[TIMING] Updated progress to 10%: ${Date.now() - progressUpdateStart}ms`)

        const variationGenStart = Date.now()
        console.log(`[TIMING] Starting character variation generation at ${new Date().toISOString()}`)
        variations = await generateCharacterVariations(
          character.id,
          template.id,
          character.front_photo_url,
          userId,
          storybookId, // Pass storybookId to update progress
          true // Skip existence check since we already checked above
        )
        console.log(`[TIMING] Character variation generation completed: ${Date.now() - variationGenStart}ms`)
        console.log(`✅ Character variations generated successfully`)
      } catch (error: any) {
        console.error(`❌ Failed to generate character variations:`, error)
        await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'failed',
            error_message: `Failed to generate character variations: ${error.message}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)
        throw error // Stop the process
      }
    } else {
      console.log(`✅ Using existing character variations:`)
      console.log(`  Front: ${variations.front_variation_url}`)
      console.log(`  Left: ${variations.left_variation_url}`)
      console.log(`  Right: ${variations.right_variation_url}`)
      // Character variations already exist, set progress to 100% (character generation complete)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 100, updated_at: new Date().toISOString() })
        .eq('id', storybookId)
    }
    console.log('=====================================\n')

    // Initialize scenes array - use existing scenes if resuming from preview
    let generatedScenes = isResumingFromPreview && hasPreviewScene
      ? existingScenes
      : Array.isArray(storybook.scenes) ? storybook.scenes : []

    // If resuming from preview, we've already done character variations and first scene
    // Set progress accordingly
    const initialProgress = isResumingFromPreview && hasPreviewScene ? 110 : 110
    await supabaseAdmin
      .from('storybooks')
      .update({ progress: initialProgress, updated_at: new Date().toISOString() })
      .eq('id', storybookId)

    // If resuming from preview, skip first scene generation
    const scenesToGenerate = isResumingFromPreview && hasPreviewScene
      ? scenes.filter(s => s.scene_number !== existingScenes[0]?.scene_number)
      : scenes

    // Helper function to check if scene already exists in database
    const checkSceneExists = async (sceneNumber: number): Promise<boolean> => {
      const { data: currentStorybook } = await supabaseAdmin
        .from('storybooks')
        .select('scenes')
        .eq('id', storybookId)
        .single()

      const currentScenes = Array.isArray(currentStorybook?.scenes) ? currentStorybook.scenes : []
      const existingScene = currentScenes.find((s: any) => s.scene_number === sceneNumber)
      const exists = !!existingScene?.image_url
      
      if (exists) {
        console.log(`Scene ${sceneNumber} already exists in database with image_url`)
      }
      
      return exists
    }

    // Helper function to generate a single scene
    const generateScene = async (sceneTemplate: SceneTemplate, attempt: number = 1): Promise<void> => {
      // Check database first to avoid duplicate predictions
      const alreadyExists = await checkSceneExists(sceneTemplate.scene_number)
      if (alreadyExists) {
        console.log(`Scene ${sceneTemplate.scene_number} already generated in database, skipping`)
        return
      }

      try {
      console.log(`Generating scene ${sceneTemplate.scene_number} (attempt ${attempt}/3)`)

      // Validate required fields
      if (!sceneTemplate.base_photo || sceneTemplate.base_photo.trim() === '') {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing base_photo field`)
      }
      if (!sceneTemplate.child_photo || !['front', 'left', 'right'].includes(sceneTemplate.child_photo)) {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing or invalid child_photo field`)
      }
      if (!sceneTemplate.insertion_prompt || sceneTemplate.insertion_prompt.trim() === '') {
        throw new Error(`Scene ${sceneTemplate.scene_number} missing insertion_prompt field`)
      }

      // Always use front variation for all scenes (we only generate one variation now)
      const characterVariationUrl = variations.front_variation_url

      if (!characterVariationUrl) {
        throw new Error(`Character variation URL not found`)
      }

      // Convert character variation URL to signed URL for Replicate access
      const { getSignedUrl } = await import('@/lib/supabase/storage')
      const extractStoragePath = (url: string): string | null => {
        const match = url.match(/character-variations\/(.+)$/)
        if (match) {
          return match[1]
        }
        return null
      }

      const variationStoragePath = extractStoragePath(characterVariationUrl)
      if (!variationStoragePath) {
        throw new Error(`Could not extract storage path from character variation URL: ${characterVariationUrl}`)
      }

      // Create signed URL (valid for 1 hour) for Replicate to access
      characterVariationUrl = await getSignedUrl('character-variations', variationStoragePath, 3600)

      // Construct base photo path
      const basePhotoPath = `/day-at-the-zoo/${sceneTemplate.base_photo}`

      console.log(`\n=== SCENE ${sceneTemplate.scene_number} GENERATION ===`)
      console.log(`Character: ${character.name}`)
      console.log(`Base photo path: ${basePhotoPath}`)
      console.log(`Character variation type: ${sceneTemplate.child_photo}`)
      console.log(`\n--- INSERTION PROMPT ---`)
      console.log(sceneTemplate.insertion_prompt)
      console.log(`\n--- END INSERTION PROMPT ---`)
      console.log('=====================================\n')

      // Double-check database right before creating prediction to avoid race conditions
      const stillNeeded = !(await checkSceneExists(sceneTemplate.scene_number))
      if (!stillNeeded) {
        console.log(`Scene ${sceneTemplate.scene_number} was completed by another process, skipping`)
        return
      }

      // Create prediction
      const { createBasePhotoAndCharacterPrediction, pollPrediction } = await import('./image-generation')
      const predictionId = await createBasePhotoAndCharacterPrediction(
        basePhotoPath,
        characterVariationUrl,
        sceneTemplate.insertion_prompt,
        sceneTemplate.aspect_ratio || '9:16',
        template.id // Pass template ID to get model from template
      )
      
      console.log(`Created prediction ${predictionId} for scene ${sceneTemplate.scene_number}`)

      // Update progress when prediction is created
      // Scene progress: 10% base + (scene_number / totalScenes) * 90% = 10% to 100%
      // Add 100 to indicate scene generation phase
      const sceneProgress = Math.round(10 + ((sceneTemplate.scene_number) / totalScenes) * 90)
      await supabaseAdmin
        .from('storybooks')
        .update({ progress: 100 + sceneProgress, updated_at: new Date().toISOString() })
        .eq('id', storybookId)

      // Poll for the result
      const generatedImageUrl = await pollPrediction(predictionId)
      console.log(`Scene ${sceneTemplate.scene_number} generated successfully:`, generatedImageUrl)

      // Download image from Replicate
      const imageResponse = await fetch(generatedImageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()

      // Upload to Supabase Storage
      const { uploadToStorage } = await import('@/lib/supabase/storage')
      console.log(`Uploading scene ${sceneTemplate.scene_number} image to storage...`)
      const storedImageUrl = await uploadToStorage(
        'storybook-scenes',
        `${storybookId}/scene-${sceneTemplate.scene_number}.jpg`,
        imageBuffer,
        'image/jpeg'
      )
      console.log(`✅ Scene ${sceneTemplate.scene_number} image uploaded to storage: ${storedImageUrl}`)

      // Create scene data
      const titleCaseName = character.name.charAt(0).toUpperCase() + character.name.slice(1).toLowerCase()
      const scriptText = sceneTemplate.script_text
        .replace(/\[Name\]/g, titleCaseName)
        .replace(/\[NAME\]/g, titleCaseName)
        .replace(/{character_name}/g, titleCaseName)

      const sceneData = {
        scene_number: sceneTemplate.scene_number,
        headline: sceneTemplate.headline,
        image_url: storedImageUrl,
        text: scriptText,
        generated_at: new Date().toISOString(),
      }
      
      console.log(`Scene ${sceneTemplate.scene_number} data prepared:`, {
        scene_number: sceneData.scene_number,
        headline: sceneData.headline,
        image_url: sceneData.image_url,
        has_text: !!sceneData.text,
      })

      // Update storybook scenes array atomically with retry logic to handle race conditions
      // When scenes are generated in parallel, multiple scenes might try to update the array simultaneously
      // We need to retry until we successfully update the array with our scene
      let updateSuccess = false
      let updateAttempts = 0
      const maxUpdateAttempts = 5
      
      while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
        updateAttempts++
        
        // Fetch current scenes
        const { data: currentStorybook, error: fetchError } = await supabaseAdmin
          .from('storybooks')
          .select('scenes')
          .eq('id', storybookId)
          .single()

        if (fetchError) {
          console.error(`Failed to fetch scenes for update (attempt ${updateAttempts}):`, fetchError)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100 * updateAttempts))
            continue
          } else {
            throw new Error(`Failed to fetch scenes after ${maxUpdateAttempts} attempts: ${fetchError.message}`)
          }
        }

        const currentScenes = Array.isArray(currentStorybook?.scenes) ? currentStorybook.scenes : []
        
        // Check if scene already exists (another process might have added it)
        const existingIndex = currentScenes.findIndex(
          (s: any) => s.scene_number === sceneTemplate.scene_number
        )
        
        if (existingIndex >= 0 && currentScenes[existingIndex]?.image_url) {
          // Scene already exists with image, skip update
          console.log(`Scene ${sceneTemplate.scene_number} already exists in database, skipping update`)
          updateSuccess = true
          break
        }

        // Prepare updated scenes array
        const updatedScenes = [...currentScenes]
        if (existingIndex >= 0) {
          updatedScenes[existingIndex] = sceneData
        } else {
          updatedScenes.push(sceneData)
        }

        // Sort scenes by scene_number to ensure correct order
        updatedScenes.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))

        // Update database with new scene
        const { error: updateError, data: updateData } = await supabaseAdmin
          .from('storybooks')
          .update({
            scenes: updatedScenes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)
          .select('scenes')

        if (updateError) {
          console.error(`❌ Failed to update scenes (attempt ${updateAttempts}):`, updateError)
          console.error(`Update error details:`, JSON.stringify(updateError, null, 2))
          if (updateAttempts < maxUpdateAttempts) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, updateAttempts - 1)))
            continue
          } else {
            throw new Error(`Failed to update scenes after ${maxUpdateAttempts} attempts: ${updateError.message}`)
          }
        }

        // Log successful update
        if (updateData && updateData.length > 0) {
          console.log(`✅ Scene ${sceneTemplate.scene_number} update query succeeded (attempt ${updateAttempts})`)
        }

        // Verify the update succeeded by checking if our scene is in the database
        console.log(`Verifying scene ${sceneTemplate.scene_number} was saved to database...`)
        const { data: verifyStorybook, error: verifyError } = await supabaseAdmin
          .from('storybooks')
          .select('scenes')
          .eq('id', storybookId)
          .single()

        if (verifyError) {
          console.error(`❌ Failed to verify scene update:`, verifyError)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, updateAttempts - 1)))
            continue
          } else {
            throw new Error(`Failed to verify scene update after ${maxUpdateAttempts} attempts: ${verifyError.message}`)
          }
        }

        const verifyScenes = Array.isArray(verifyStorybook?.scenes) ? verifyStorybook.scenes : []
        const verifyScene = verifyScenes.find((s: any) => s.scene_number === sceneTemplate.scene_number)
        
        console.log(`Verification result for scene ${sceneTemplate.scene_number}:`, {
          found: !!verifyScene,
          has_image_url: !!verifyScene?.image_url,
          image_url_matches: verifyScene?.image_url === sceneData.image_url,
          total_scenes_in_db: verifyScenes.length,
        })
        
        if (verifyScene?.image_url === sceneData.image_url) {
          // Update succeeded
          updateSuccess = true
          generatedScenes = verifyScenes
          console.log(`✅ Scene ${sceneTemplate.scene_number} completed successfully (update attempt ${updateAttempts})`)
        } else if (verifyScene?.image_url && verifyScene.image_url !== sceneData.image_url) {
          // Scene exists but with different URL - might be from another process
          console.log(`⚠️ Scene ${sceneTemplate.scene_number} exists with different image_url. Expected: ${sceneData.image_url}, Found: ${verifyScene.image_url}`)
          // Consider this a success if the scene has an image_url
          updateSuccess = true
          generatedScenes = verifyScenes
          console.log(`✅ Scene ${sceneTemplate.scene_number} already exists in database, using existing`)
        } else {
          // Update was overwritten by another process, retry
          console.log(`Scene ${sceneTemplate.scene_number} update was overwritten or not found, retrying (attempt ${updateAttempts}/${maxUpdateAttempts})...`)
          if (updateAttempts < maxUpdateAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, updateAttempts - 1)))
          }
        }
      }

      if (!updateSuccess) {
        throw new Error(`Failed to update scene ${sceneTemplate.scene_number} after ${maxUpdateAttempts} attempts due to race conditions`)
      }
      } catch (error: any) {
        console.error(`Scene ${sceneTemplate.scene_number} attempt ${attempt} failed:`, error.message)
        
        // Retry logic: up to 3 attempts
        if (attempt < 3) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          return generateScene(sceneTemplate, attempt + 1)
        } else {
          // All retries failed
          throw new Error(`Failed to generate scene ${sceneTemplate.scene_number} after 3 attempts: ${error.message}`)
        }
      }
    }

    // Generate all scenes in parallel
    console.log(`\n=== STARTING PARALLEL SCENE GENERATION ===`)
    console.log(`Generating ${scenesToGenerate.length} scenes concurrently...`)
    if (isResumingFromPreview && hasPreviewScene) {
      console.log(`[RESUME] Skipping preview scene (scene ${existingScenes[0]?.scene_number})`)
    }
    
    const scenePromises = scenesToGenerate.map(sceneTemplate => generateScene(sceneTemplate))
    const results = await Promise.allSettled(scenePromises)
    
    // Check for failures
    const failures = results
      .map((result, index) => ({ result, sceneNumber: scenesToGenerate[index].scene_number }))
      .filter(({ result }) => result.status === 'rejected')

    if (failures.length > 0) {
      const errorMessages = failures.map(({ result, sceneNumber }) => 
        `Scene ${sceneNumber}: ${result.status === 'rejected' ? result.reason?.message || 'Unknown error' : ''}`
      ).join('\n')
      
      await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'failed',
          error_message: `Failed to generate ${failures.length} scene(s):\n${errorMessages}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)

      throw new Error(`Failed to generate ${failures.length} scene(s)`)
    }

    // Verify all scenes exist in database before marking as complete
    // Add a small delay to ensure all database writes have completed
    console.log(`\n=== VERIFYING ALL SCENES ARE COMPLETE ===`)
    console.log(`Waiting 2 seconds for all database writes to complete...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Retry verification up to 3 times with exponential backoff
    let finalScenes: any[] = []
    let completedScenes = 0
    let verifyAttempt = 0
    const maxVerifyAttempts = 3
    
    while (verifyAttempt < maxVerifyAttempts) {
      verifyAttempt++
      console.log(`Verification attempt ${verifyAttempt}/${maxVerifyAttempts}...`)
      
      let finalStorybook: any = null
      let verifyError: any = null
      
      try {
        const result = await supabaseAdmin
          .from('storybooks')
          .select('scenes')
          .eq('id', storybookId)
          .single()
        
        finalStorybook = result.data
        verifyError = result.error
      } catch (err: any) {
        verifyError = err
        console.error(`❌ Exception verifying scenes (attempt ${verifyAttempt}):`, err)
      }

      if (verifyError) {
        console.error(`❌ Error verifying scenes (attempt ${verifyAttempt}):`, verifyError)
        console.error(`Error code: ${verifyError.code}, Error message: ${verifyError.message}`)
        if (verifyAttempt === maxVerifyAttempts) {
          // If verification fails but we know scenes exist, try to proceed anyway
          console.error(`⚠️ Verification failed after ${maxVerifyAttempts} attempts, but proceeding with final scenes from last successful fetch`)
          if (finalScenes.length === totalScenes) {
            console.log(`⚠️ Using cached scenes array (${finalScenes.length} scenes) since verification is failing`)
            break
          } else {
            throw new Error(`Failed to verify scenes after ${maxVerifyAttempts} attempts: ${verifyError.message}`)
          }
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, verifyAttempt) * 1000))
        continue
      }

      finalScenes = Array.isArray(finalStorybook?.scenes) ? finalStorybook.scenes : []
      completedScenes = finalScenes.filter((s: any) => s.image_url).length
      
      console.log(`Found ${completedScenes}/${totalScenes} completed scenes in database`)
      console.log(`Scene numbers with images:`, finalScenes.filter((s: any) => s.image_url).map((s: any) => s.scene_number).sort((a, b) => a - b))

      if (completedScenes >= totalScenes) {
        console.log(`✅ All scenes verified complete on attempt ${verifyAttempt}`)
        break
      }
      
      if (verifyAttempt < maxVerifyAttempts) {
        const missingScenes = scenes
          .map(s => s.scene_number)
          .filter(num => !finalScenes.find((s: any) => s.scene_number === num && s.image_url))
        console.log(`⚠️ Only ${completedScenes}/${totalScenes} scenes found. Missing: ${missingScenes.join(', ')}. Retrying...`)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, verifyAttempt) * 1000))
      }
    }

    if (completedScenes < totalScenes) {
      const missingScenes = scenes
        .map(s => s.scene_number)
        .filter(num => !finalScenes.find((s: any) => s.scene_number === num && s.image_url))
      
      console.error(`⚠️ Warning: Only ${completedScenes}/${totalScenes} scenes completed after ${maxVerifyAttempts} verification attempts. Missing scenes: ${missingScenes.join(', ')}`)
      
      const { error: updateError } = await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'failed',
          error_message: `Only ${completedScenes}/${totalScenes} scenes generated. Missing scenes: ${missingScenes.join(', ')}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)

      if (updateError) {
        console.error(`❌ Failed to update storybook status to failed:`, updateError)
      }

      throw new Error(`Only ${completedScenes}/${totalScenes} scenes generated. Missing: ${missingScenes.join(', ')}`)
    }
    
    console.log(`✅ All ${totalScenes} scenes verified complete`)

    // Verify scene images exist in storage
    console.log(`\n=== VERIFYING SCENE IMAGES IN STORAGE ===`)
    const { supabaseAdmin: storageAdmin } = await import('@/lib/supabase/server')
    try {
      const { data: storageFiles, error: storageError } = await storageAdmin.storage
        .from('storybook-scenes')
        .list(storybookId, {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (!storageError && storageFiles) {
        console.log(`Found ${storageFiles.length} scene file(s) in storage for storybook ${storybookId}`)
        const storageFileNames = storageFiles.map(f => f.name).sort()
        const expectedFileNames = finalScenes.map((s: any) => `scene-${s.scene_number}.jpg`).sort()
        console.log(`Storage files:`, storageFileNames)
        console.log(`Expected files:`, expectedFileNames)
        
        const missingFiles = expectedFileNames.filter(name => !storageFileNames.includes(name))
        if (missingFiles.length > 0) {
          console.error(`⚠️ Warning: Missing scene files in storage: ${missingFiles.join(', ')}`)
        } else {
          console.log(`✅ All scene files verified in storage`)
        }
      } else if (storageError) {
        console.error(`⚠️ Warning: Could not verify storage files:`, storageError)
      }
    } catch (err) {
      console.error(`⚠️ Warning: Error checking storage files:`, err)
    }
    console.log(`==========================================\n`)

    // Sort scenes by scene_number one final time before marking as completed
    finalScenes.sort((a: any, b: any) => (a.scene_number || 0) - (b.scene_number || 0))
    
    // Validate scenes array before saving
    if (finalScenes.length !== totalScenes) {
      console.error(`❌ Scene count mismatch: Expected ${totalScenes}, found ${finalScenes.length}`)
      throw new Error(`Scene count mismatch: Expected ${totalScenes}, found ${finalScenes.length}`)
    }
    
    const sceneNumbers = finalScenes.map((s: any) => s.scene_number).sort((a, b) => a - b)
    const expectedSceneNumbers = scenes.map(s => s.scene_number).sort((a, b) => a - b)
    
    if (JSON.stringify(sceneNumbers) !== JSON.stringify(expectedSceneNumbers)) {
      console.error(`❌ Scene numbers mismatch: Expected ${JSON.stringify(expectedSceneNumbers)}, found ${JSON.stringify(sceneNumbers)}`)
      throw new Error(`Scene numbers mismatch: Expected ${expectedSceneNumbers.join(', ')}, found ${sceneNumbers.join(', ')}`)
    }
    
    // Validate all scenes have required fields
    for (const scene of finalScenes) {
      if (!scene.scene_number || !scene.image_url) {
        console.error(`❌ Invalid scene data:`, scene)
        throw new Error(`Scene ${scene.scene_number || 'unknown'} is missing required fields`)
      }
    }
    
    console.log(`✅ Scenes array validated: ${finalScenes.length} scenes, all with image_url`)
    console.log(`Scene details:`, finalScenes.map((s: any) => ({
      scene_number: s.scene_number,
      has_image_url: !!s.image_url,
      image_url_preview: s.image_url ? s.image_url.substring(0, 100) + '...' : 'MISSING',
      has_text: !!s.text,
      headline: s.headline,
    })))

    // All scenes generated successfully - mark as completed
    // Set progress to 200 (which displays as 100% in scene generation phase)
    // The UI subtracts 100 from progress >= 100 to get scene progress (0-100%)
    // So 200 - 100 = 100% completion
    // Database constraint allows 0-200 (migration 014)
    console.log(`✅ All ${totalScenes} scenes verified in database. Marking storybook as completed.`)
    console.log(`Final scenes array length: ${finalScenes.length}`)
    console.log(`Final scenes scene_numbers:`, finalScenes.map((s: any) => s.scene_number).sort((a, b) => a - b))
    
    // Retry the completion update in case of transient errors
    let completionUpdateSuccess = false
    let completionAttempts = 0
    const maxCompletionAttempts = 3
    
    while (!completionUpdateSuccess && completionAttempts < maxCompletionAttempts) {
      completionAttempts++
      console.log(`Attempting to mark storybook as completed (attempt ${completionAttempts}/${maxCompletionAttempts})...`)
      
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('storybooks')
        .update({
          status: 'completed',
          progress: 200, // Scene generation complete (displays as 100%)
          scenes: finalScenes, // Ensure scenes are sorted before final save
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', storybookId)
        .select('status')

      if (updateError) {
        console.error(`❌ Failed to update storybook status to completed (attempt ${completionAttempts}):`, updateError)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Failed to mark storybook as completed after ${maxCompletionAttempts} attempts: ${updateError.message}`)
        }
      }

      // Verify the update succeeded
      const { data: verifyComplete, error: verifyError } = await supabaseAdmin
        .from('storybooks')
        .select('status')
        .eq('id', storybookId)
        .single()

      if (verifyError) {
        console.error(`❌ Error verifying completion status (attempt ${completionAttempts}):`, verifyError)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Failed to verify completion status after ${maxCompletionAttempts} attempts: ${verifyError.message}`)
        }
      }

      if (verifyComplete?.status === 'completed') {
        console.log(`✅ Storybook successfully marked as completed on attempt ${completionAttempts}`)
        completionUpdateSuccess = true
        break
      } else {
        console.error(`❌ Storybook status update verification failed. Expected 'completed', got '${verifyComplete?.status}'`)
        if (completionAttempts < maxCompletionAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * completionAttempts))
          continue
        } else {
          throw new Error(`Storybook status was not set to completed after ${maxCompletionAttempts} attempts. Current status: ${verifyComplete?.status}`)
        }
      }
    }
    
    if (!completionUpdateSuccess) {
      throw new Error(`Failed to mark storybook as completed after ${maxCompletionAttempts} attempts`)
    }

    // Update generation job status
    const { error: jobUpdateError } = await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('storybook_id', storybookId)

    if (jobUpdateError) {
      console.error(`⚠️ Warning: Failed to update generation job status:`, jobUpdateError)
      // Don't throw - storybook is already marked as completed
    }

    console.log(`✅ Storybook ${storybookId} generation completed - all ${totalScenes} scenes generated successfully`)
  } catch (error: any) {
    // Ensure status is updated even if an unexpected error occurs
    console.error(`❌ Unexpected error during storybook generation:`, error)
    console.error(`Error stack:`, error.stack)
    
    // Try to update status to failed with retries
    let statusUpdateSuccess = false
    for (let retry = 0; retry < 3; retry++) {
      try {
        const { error: updateError } = await supabaseAdmin
          .from('storybooks')
          .update({
            status: 'failed',
            error_message: `Error: ${error.message || 'Unknown error'}`.substring(0, 500), // Limit error message length
            updated_at: new Date().toISOString(),
          })
          .eq('id', storybookId)
        
        if (!updateError) {
          statusUpdateSuccess = true
          console.log(`✅ Successfully updated storybook status to 'failed'`)
          break
        } else {
          console.error(`❌ Failed to update storybook status (attempt ${retry + 1}/3):`, updateError)
          if (retry < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)))
          }
        }
      } catch (updateErr: any) {
        console.error(`❌ Exception updating storybook status (attempt ${retry + 1}/3):`, updateErr)
        if (retry < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)))
        }
      }
    }
    
    if (!statusUpdateSuccess) {
      console.error(`❌ CRITICAL: Failed to update storybook status after 3 attempts. Storybook ${storybookId} may be stuck in 'generating' status.`)
    }
    
    throw error // Re-throw to let caller know it failed
  }
}
