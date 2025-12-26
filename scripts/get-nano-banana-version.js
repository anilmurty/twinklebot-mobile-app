/**
 * Helper script to get the nano-banana model version ID
 * Run with: REPLICATE_API_TOKEN=your_token node scripts/get-nano-banana-version.js
 * Or: Load .env.local manually and run
 */

// Try to load from .env.local if it exists
const fs = require('fs')
const path = require('path')

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

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN
const REPLICATE_API_URL = 'https://api.replicate.com/v1'

async function getModelInfo() {
  if (!REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not found in .env.local')
    process.exit(1)
  }

  try {
    // Try to get model info
    const response = await fetch(
      `${REPLICATE_API_URL}/models/google/nano-banana`,
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to get model info:', response.status, errorText)
      process.exit(1)
    }

    const modelData = await response.json()
    console.log('\n📋 Model Info:')
    console.log('   Name:', modelData.name)
    console.log('   Owner:', modelData.owner)
    
    if (modelData.default_version) {
      console.log('\n✅ Default Version ID:', modelData.default_version)
      console.log('\n💡 Add this to your .env.local:')
      console.log(`   NANOBANANA_MODEL_VERSION=${modelData.default_version}`)
    } else {
      console.log('\n⚠️  No default_version found')
      console.log('\n📝 Manual steps:')
      console.log('   1. Go to https://replicate.com/google/nano-banana')
      console.log('   2. Click on "API" or "Versions" tab')
      console.log('   3. Look for version ID in the code examples')
      console.log('   4. Set NANOBANANA_MODEL_VERSION=<version-id> in .env.local')
    }

    // Try versions endpoint anyway
    console.log('\n🔍 Trying versions endpoint...')
    const versionsResponse = await fetch(
      `${REPLICATE_API_URL}/models/google/nano-banana/versions`,
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (versionsResponse.ok) {
      const versionsData = await versionsResponse.json()
      if (versionsData.results && versionsData.results.length > 0) {
        console.log('✅ Found versions:')
        versionsData.results.slice(0, 3).forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.id} (created: ${v.created_at})`)
        })
        console.log('\n💡 Use the first version ID in your .env.local:')
        console.log(`   NANOBANANA_MODEL_VERSION=${versionsData.results[0].id}`)
      }
    } else {
      const errorText = await versionsResponse.text()
      console.log('⚠️  Versions endpoint not available:', errorText)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

getModelInfo()

