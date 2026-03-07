/**
 * Upload cover images to Supabase Storage
 *
 * For each .png file in the local folder:
 * 1. Extract the name without .png extension
 * 2. Check if a folder with that name exists in the target bucket
 * 3. If the folder exists and already contains a file with the same name, skip it
 * 4. Otherwise, create the folder (if needed) and upload the file
 *
 * Usage:
 *   npx tsx scripts/upload-cover-images.ts <local-folder> <bucket-name>
 *
 * Example:
 *   npx tsx scripts/upload-cover-images.ts ./coming-soon-covers story-covers
 */

import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local
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
  console.error('Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Parse CLI args
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: npx tsx scripts/upload-cover-images.ts <local-folder> <bucket-name>')
  console.error('Example: npx tsx scripts/upload-cover-images.ts ./coming-soon-covers story-covers')
  process.exit(1)
}

const localFolder = path.resolve(args[0])
const bucketName = args[1]

if (!fs.existsSync(localFolder) || !fs.statSync(localFolder).isDirectory()) {
  console.error(`Local folder not found: ${localFolder}`)
  process.exit(1)
}

async function main() {
  // Get all .png files from the local folder
  const pngFiles = fs.readdirSync(localFolder).filter(f => f.toLowerCase().endsWith('.png'))

  if (pngFiles.length === 0) {
    console.log('No .png files found in', localFolder)
    return
  }

  console.log(`Found ${pngFiles.length} .png file(s) in ${localFolder}`)
  console.log(`Target bucket: ${bucketName}\n`)

  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const filename of pngFiles) {
    const folderName = filename.replace(/\.png$/i, '')
    const storagePath = `${folderName}/${filename}`

    // Check if file already exists by listing the folder
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderName, { limit: 100 })

    if (!listError && existingFiles && existingFiles.some(f => f.name === filename)) {
      console.log(`SKIP  ${storagePath} (already exists)`)
      skipped++
      continue
    }

    // Upload the file (this creates the "folder" implicitly)
    const fileBuffer = fs.readFileSync(path.join(localFolder, filename))
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error(`ERROR ${storagePath}: ${uploadError.message}`)
      errors++
    } else {
      console.log(`OK    ${storagePath}`)
      uploaded++
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Errors: ${errors}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
