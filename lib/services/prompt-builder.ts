/**
 * Builds prompts for image generation based on model configuration
 */

interface PromptParts {
  subject: string
  action: string
  detail: string
  style: string
}

interface PromptStructure {
  parts_order: string[]
  separator: string
  placeholders: Record<string, string>
  fixed_parts: string[]
  variable_parts: string[]
}

export function buildPrompt(
  fixedParts: Record<string, string>,
  variableParts: Record<string, string>,
  promptStructure: PromptStructure,
  characterName: string
): string {
  const parts: string[] = []
  
  // Replace placeholders in all parts
  const replacePlaceholders = (text: string): string => {
    let result = text
    for (const [key, placeholder] of Object.entries(promptStructure.placeholders)) {
      if (key === 'character_name') {
        result = result.replace(new RegExp(placeholder, 'g'), characterName)
      }
    }
    return result
  }
  
  // Build parts in the specified order
  for (const partName of promptStructure.parts_order) {
    let partText: string
    
    if (promptStructure.fixed_parts.includes(partName)) {
      partText = fixedParts[partName] || ''
    } else if (promptStructure.variable_parts.includes(partName)) {
      partText = variableParts[partName] || ''
    } else {
      continue
    }
    
    partText = replacePlaceholders(partText)
    if (partText) {
      parts.push(partText)
    }
  }
  
  return parts.join(promptStructure.separator)
}

export function buildNanoBananaPrompt(
  fixedParts: { subject: string; style: string },
  variableParts: { action: string },
  characterName: string
): string {
  // Replace placeholders
  const replacePlaceholders = (text: string): string => {
    return text.replace(/{character_name}/g, characterName)
  }
  
  const subject = replacePlaceholders(fixedParts.subject)
  const style = replacePlaceholders(fixedParts.style)
  const action = replacePlaceholders(variableParts.action)
  
  // Build prompt with labels for subject and style, but not for action
  return `Subject: ${subject}\n\n${action}\n\nStyle: ${style}`
}

