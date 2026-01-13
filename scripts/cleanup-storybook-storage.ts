/**
 * Script to clean up storage bucket files for storybooks without scenes
 * 
 * This script:
 * 1. Queries the database for storybooks that have at least one scene
 * 2. Lists all folders in the storybook-scenes storage bucket
 * 3. Deletes folders/files for storybook IDs that don't have scenes in the database
 * 
 * Run with: npx tsx scripts/cleanup-storybook-storage.ts
 * Or: ts-node scripts/cleanup-storybook-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local (similar to get-nano-banana-version.js)
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface StorybookWithScenes {
  id: string
  scenes: any[] | null
}

/**
 * Check if a storybook has at least one scene
 */
function hasScenes(storybook: StorybookWithScenes): boolean {
  if (!storybook.scenes) {
    return false
  }
  
  if (!Array.isArray(storybook.scenes)) {
    return false
  }
  
  return storybook.scenes.length > 0
}

/**
 * Get all storybook IDs that have at least one scene
 */
async function getStorybooksWithScenes(): Promise<Set<string>> {
  console.log('\n📊 Querying database for storybooks with scenes...')
  
  const { data: storybooks, error } = await supabaseAdmin
    .from('storybooks')
    .select('id, scenes')
  
  if (error) {
    throw new Error(`Failed to query storybooks: ${error.message}`)
  }
  
  const storybooksWithScenes = new Set<string>()
  const storybooksWithoutScenes: string[] = []
  
  storybooks?.forEach((storybook) => {
    if (hasScenes(storybook)) {
      storybooksWithScenes.add(storybook.id)
    } else {
      storybooksWithoutScenes.push(storybook.id)
    }
  })
  
  console.log(`✅ Found ${storybooksWithScenes.size} storybook(s) with scenes`)
  console.log(`   ${storybooksWithoutScenes.length} storybook(s) without scenes in DB`)
  
  return storybooksWithScenes
}

/**
 * List all files and folders in the storybook-scenes bucket
 * Returns:
 * - storybookFiles: map of storybookId -> array of file paths (for folders with files)
 * - emptyFolders: array of storybook IDs that appear as folders but have no files
 */
async function listAllStorageFiles(): Promise<{
  storybookFiles: Map<string, string[]>
  emptyFolders: string[]
  allFolders: string[]
}> {
  console.log('\n📁 Listing all files in storybook-scenes bucket...')
  
  const storybookFiles = new Map<string, string[]>()
  const emptyFolders: string[] = []
  const allFolders: string[] = []
  
  // First, list all top-level items (folders/storybook IDs)
  const { data: topLevelItems, error: topLevelError } = await supabaseAdmin.storage
    .from('storybook-scenes')
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    })
  
  if (topLevelError) {
    throw new Error(`Failed to list storage items: ${topLevelError.message}`)
  }
  
  if (!topLevelItems || topLevelItems.length === 0) {
    console.log(`✅ No folders found in storage`)
    return { storybookFiles, emptyFolders, allFolders }
  }
  
  // For each item, check if it's a folder (storybook ID) and list files inside
  for (const item of topLevelItems) {
    // Skip files at root level (shouldn't exist, but just in case)
    if (item.name.includes('.')) {
      continue
    }
    
    const storybookId = item.name
    allFolders.push(storybookId)
    
    // List all files in this storybook folder
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('storybook-scenes')
      .list(storybookId, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      })
    
    if (filesError) {
      // If listing fails, the folder might be empty
      emptyFolders.push(storybookId)
      continue
    }
    
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${storybookId}/${file.name}`)
      storybookFiles.set(storybookId, filePaths)
    } else {
      // Folder exists but has no files
      emptyFolders.push(storybookId)
    }
  }
  
  const totalFiles = Array.from(storybookFiles.values()).reduce((sum, files) => sum + files.length, 0)
  console.log(`✅ Found ${allFolders.length} total folder(s):`)
  console.log(`   - ${storybookFiles.size} folder(s) with ${totalFiles} file(s)`)
  console.log(`   - ${emptyFolders.length} empty folder(s)`)
  
  return { storybookFiles, emptyFolders, allFolders }
}

/**
 * Delete all files for a storybook
 */
async function deleteStorybookFiles(storybookId: string, filePaths: string[]): Promise<number> {
  if (!filePaths || filePaths.length === 0) {
    return 0
  }
  
  // Delete all files
  const { error: deleteError } = await supabaseAdmin.storage
    .from('storybook-scenes')
    .remove(filePaths)
  
  if (deleteError) {
    console.error(`   ⚠️  Failed to delete files for ${storybookId}: ${deleteError.message}`)
    return 0
  }
  
  return filePaths.length
}

/**
 * Main cleanup function
 */
async function cleanupStorage() {
  console.log('🧹 Starting storage cleanup for storybooks without scenes...\n')
  
  try {
    // Step 1: Get storybooks with scenes from database
    const storybooksWithScenes = await getStorybooksWithScenes()
    
    // Step 2: List all files and folders in storage
    const { storybookFiles, emptyFolders, allFolders } = await listAllStorageFiles()
    
    // Step 3: Find storybook IDs in storage that don't have scenes in the database
    const storybooksToDelete: Array<{ id: string; files: string[] }> = []
    const emptyFoldersToDelete: string[] = []
    
    // Check folders with files
    for (const [storybookId, files] of storybookFiles.entries()) {
      if (!storybooksWithScenes.has(storybookId)) {
        storybooksToDelete.push({ id: storybookId, files })
      }
    }
    
    // Check empty folders
    for (const storybookId of emptyFolders) {
      if (!storybooksWithScenes.has(storybookId)) {
        emptyFoldersToDelete.push(storybookId)
      }
    }
    
    if (storybooksToDelete.length === 0 && emptyFoldersToDelete.length === 0) {
      console.log('\n✅ No orphaned storybooks found. Storage is clean!')
      return
    }
    
    const totalFilesToDelete = storybooksToDelete.reduce((sum, sb) => sum + sb.files.length, 0)
    
    if (storybooksToDelete.length > 0) {
      console.log(`\n🗑️  Found ${storybooksToDelete.length} orphaned storybook(s) with ${totalFilesToDelete} file(s) to delete:`)
      storybooksToDelete.forEach(({ id, files }) => {
        console.log(`   - ${id} (${files.length} file(s))`)
      })
    }
    
    if (emptyFoldersToDelete.length > 0) {
      console.log(`\n📁 Found ${emptyFoldersToDelete.length} empty orphaned folder(s):`)
      emptyFoldersToDelete.forEach(id => {
        console.log(`   - ${id} (empty)`)
      })
      console.log(`\n   Attempting to verify these folders are truly empty...`)
      
      // Double-check by trying to list files in each empty folder
      // Sometimes Supabase Storage API can have timing issues
      let actuallyEmpty = 0
      let hasHiddenFiles = 0
      
      for (const folderId of emptyFoldersToDelete) {
        const { data: recheckFiles, error: recheckError } = await supabaseAdmin.storage
          .from('storybook-scenes')
          .list(folderId, {
            limit: 100,
            sortBy: { column: 'name', order: 'asc' }
          })
        
        if (!recheckError && recheckFiles && recheckFiles.length > 0) {
          hasHiddenFiles++
          console.log(`   ⚠️  ${folderId} actually has ${recheckFiles.length} file(s)!`)
          // Delete these files
          const filePaths = recheckFiles.map(file => `${folderId}/${file.name}`)
          await deleteStorybookFiles(folderId, filePaths)
        } else {
          actuallyEmpty++
        }
      }
      
      if (hasHiddenFiles > 0) {
        console.log(`\n   ✅ Found and deleted ${hasHiddenFiles} folder(s) with hidden files`)
      }
      
      console.log(`\n   Note: ${actuallyEmpty} folder(s) are truly empty.`)
      console.log(`   These are UI artifacts - Supabase Storage doesn't have true folders.`)
      console.log(`   They will disappear when you refresh the Supabase Storage UI.`)
      console.log(`   If they persist, you may need to contact Supabase support.`)
    }
    
    // Step 4: Delete files for orphaned storybooks
    if (storybooksToDelete.length > 0) {
      console.log('\n🗑️  Deleting files...')
      let totalDeleted = 0
      let totalFilesDeleted = 0
      
      for (const { id, files } of storybooksToDelete) {
        const filesDeleted = await deleteStorybookFiles(id, files)
        if (filesDeleted > 0) {
          totalDeleted++
          totalFilesDeleted += filesDeleted
          console.log(`   ✅ Deleted ${filesDeleted} file(s) from ${id}`)
        } else {
          console.log(`   ⚠️  Failed to delete files from ${id}`)
        }
      }
      
      console.log(`\n✅ Cleanup complete!`)
      console.log(`   Deleted ${totalFilesDeleted} file(s) from ${totalDeleted} storybook(s)`)
    } else {
      console.log(`\n✅ No files to delete (only empty folders found)`)
    }
    
    if (emptyFoldersToDelete.length > 0) {
      console.log(`\n💡 Note: ${emptyFoldersToDelete.length} empty folder(s) may still appear in Supabase UI.`)
      console.log(`   This is normal - Supabase Storage doesn't have true folders, just path prefixes.`)
      console.log(`   Refresh the Storage UI to see them disappear.`)
      console.log(`\n   If empty folders persist after refreshing:`)
      console.log(`   1. Try manually deleting them in the Supabase Dashboard (Storage → storybook-scenes)`)
      console.log(`   2. Or contact Supabase support - they may need to clean up phantom folder entries`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Error during cleanup:', error.message)
    process.exit(1)
  }
}

// Run the cleanup
cleanupStorage()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

