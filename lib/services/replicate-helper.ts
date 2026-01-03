/**
 * Helper to get the latest version ID for a Replicate model
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1'

function getReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN environment variable is not set')
  }
  return token
}

export async function getModelVersion(modelName: string): Promise<string> {
  // Split model name into owner/name (e.g., "google/nano-banana" -> owner: "google", name: "nano-banana")
  const [owner, name] = modelName.split('/')
  if (!owner || !name) {
    throw new Error(`Invalid model name format: ${modelName}. Expected format: owner/name`)
  }

  try {
    // Try to get model info first (some models don't expose versions endpoint)
    const modelResponse = await fetch(
      `${REPLICATE_API_URL}/models/${owner}/${name}`,
      {
        headers: {
          Authorization: `Token ${getReplicateToken()}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (modelResponse.ok) {
      const modelData = await modelResponse.json()
      // Some models have a default_version field
      if (modelData.default_version) {
        console.log(`Found default version for ${modelName}: ${modelData.default_version}`)
        return modelData.default_version
      }
    }

    // Fallback: Try versions endpoint
    const response = await fetch(
      `${REPLICATE_API_URL}/models/${owner}/${name}/versions`,
      {
        headers: {
          Authorization: `Token ${getReplicateToken()}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { detail: errorText }
      }
      
      // If model doesn't expose versions, return a special value instead of throwing
      // This allows the caller to handle it gracefully
      if (response.status === 404 && errorData.detail?.includes('does not expose')) {
        return 'MODEL_NAME_REQUIRED' // Special marker value
      }
      
      throw new Error(`Failed to get model versions: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      const versionId = data.results[0].id
      console.log(`Found latest version for ${modelName}: ${versionId}`)
      return versionId // Return latest version ID
    }

    throw new Error('No versions found for model')
  } catch (error: any) {
    console.error('Error getting model version:', error)
    // Re-throw with specific message for models that don't expose versions
    if (error.message.includes('MODEL_DOES_NOT_EXPOSE_VERSIONS')) {
      throw error
    }
    throw new Error(`Failed to fetch model version for ${modelName}. Please set NANOBANANA_MODEL_VERSION in .env.local with a valid version ID. Error: ${error.message}`)
  }
}
