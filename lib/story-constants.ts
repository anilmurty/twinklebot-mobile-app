/**
 * Shared story category and tagline constants.
 * Used by story-library-tab, landing pages, and anywhere story metadata is displayed.
 */

export const STORY_CATEGORIES = [
  { id: "language", label: "Language Learning" },
  { id: "math", label: "Math Learning" },
  { id: "world", label: "World Knowledge" },
  { id: "science", label: "Pure Science" },
  { id: "scifi", label: "Sci-Fi & Fantasy" },
] as const

export type StoryCategoryId = (typeof STORY_CATEGORIES)[number]["id"]

/** Maps DB category values to display category IDs */
const CATEGORY_MAP: Record<string, StoryCategoryId> = {
  adventure: "world",
  numbers: "math",
  letters: "language",
  scifi: "scifi",
  math: "math",
  language: "language",
  world: "world",
  science: "science",
}

/** Resolve a template's display category from its DB category and title */
export function getDisplayCategory(title: string, dbCategory?: string): StoryCategoryId {
  if (dbCategory) {
    const mapped = CATEGORY_MAP[dbCategory]
    if (mapped) return mapped
  }
  // Fallback: infer from title
  if (title.includes("Count")) return "math"
  if (title.includes("Alphabet")) return "language"
  if (title.includes("Zoo")) return "world"
  if (title.includes("Mission") || title.includes("Moon")) return "scifi"
  return "world"
}

/** Tagline data keyed by substring match against story title */
const TAGLINE_MAP: Record<string, { verb: string; subject: string }> = {
  // Language Learning
  "Counting": { verb: "TEACHES", subject: "COUNTING 1-10" },
  "Colors of the Carnival": { verb: "TEACHES", subject: "COLORS & WORDS" },
  "Opposites at the Playground": { verb: "TEACHES", subject: "OPPOSITES" },
  "Feelings Farm": { verb: "TEACHES", subject: "EMOTIONS & WORDS" },
  "Day in My Body": { verb: "TEACHES", subject: "BODY & WORDS" },
  "Vehicles on the Go": { verb: "TEACHES", subject: "LETTERS & VEHICLES" },
  "Animals Around the World": { verb: "TEACHES", subject: "LETTERS & ANIMALS" },
  "Action Heroes": { verb: "TEACHES", subject: "ACTION WORDS" },
  "Five Senses": { verb: "TEACHES", subject: "SENSES & WORDS" },
  "Weather Words": { verb: "TEACHES", subject: "WEATHER & WORDS" },
  // Math Learning
  "Farmer": { verb: "TEACHES", subject: "COUNTING & MONEY" },
  "Bake Sale": { verb: "TEACHES", subject: "COUNTING & MONEY" },
  "Birdhouse": { verb: "TEACHES", subject: "NUMBERS & MEASURING" },
  "Camping Under the Stars": { verb: "TEACHES", subject: "COUNTING & PATTERNS" },
  "Toy Store Sort": { verb: "TEACHES", subject: "SORTING & COUNTING" },
  "Race Day": { verb: "TEACHES", subject: "NUMBERS & ORDERING" },
  "Garden Grows": { verb: "TEACHES", subject: "COUNTING & MEASURING" },
  "Pizza Party": { verb: "TEACHES", subject: "FRACTIONS & SHARING" },
  "Aquarium Helper": { verb: "TEACHES", subject: "COUNTING & SORTING" },
  "Shape City": { verb: "TEACHES", subject: "SHAPES & COUNTING" },
  // World Knowledge
  "Zoo": { verb: "EXPLORES", subject: "ANIMALS & NATURE" },
  "Fire Station": { verb: "EXPLORES", subject: "COMMUNITY HELPERS" },
  "Seed to Supermarket": { verb: "EXPLORES", subject: "FOOD SYSTEMS" },
  "Under the Ocean": { verb: "EXPLORES", subject: "OCEAN LIFE" },
  "Rainforest": { verb: "EXPLORES", subject: "NATURE & WILDLIFE" },
  "Construction Site": { verb: "EXPLORES", subject: "BUILDING & JOBS" },
  "10 Meals": { verb: "EXPLORES", subject: "FOOD & CULTURE" },
  "Weather Station": { verb: "EXPLORES", subject: "WEATHER & SCIENCE" },
  "Night Sky": { verb: "EXPLORES", subject: "SPACE & STARS" },
  "Hospital Helper": { verb: "EXPLORES", subject: "HEALTH & HELPERS" },
  "River": { verb: "EXPLORES", subject: "NATURE & GEOGRAPHY" },
  // Pure Science
  "Volcano": { verb: "EXPLORES", subject: "EARTH & GEOLOGY" },
  "Inside the Human Body": { verb: "EXPLORES", subject: "HUMAN BODY" },
  "Butterfly": { verb: "EXPLORES", subject: "METAMORPHOSIS" },
  "Water Go": { verb: "EXPLORES", subject: "WATER CYCLE" },
  "Earthquake": { verb: "EXPLORES", subject: "EARTH & GEOLOGY" },
  "Light and Shadows": { verb: "EXPLORES", subject: "LIGHT & OPTICS" },
  "Magnetic": { verb: "EXPLORES", subject: "MAGNETISM" },
  "Life of a Seed": { verb: "EXPLORES", subject: "PLANTS & GROWTH" },
  "Forces All Around": { verb: "EXPLORES", subject: "PHYSICS & FORCES" },
  "Deep Freeze": { verb: "EXPLORES", subject: "ICE & CLIMATE" },
  // Sci-Fi & Fantasy
  "Moon": { verb: "EXPLORES", subject: "SPACE & SCIENCE" },
  "Time Traveler": { verb: "EXPLORES", subject: "TIME & HISTORY" },
  "Planet of the Colors": { verb: "EXPLORES", subject: "COLORS & SPACE" },
  "Dream Architect": { verb: "EXPLORES", subject: "DREAMS & BUILDING" },
  "Robot Best Friend": { verb: "EXPLORES", subject: "ROBOTS & TECH" },
  "Guardians of the Forest": { verb: "EXPLORES", subject: "MAGIC & NATURE" },
  "Cloud Castle": { verb: "EXPLORES", subject: "WEATHER & MAGIC" },
  "Smallest Astronaut": { verb: "EXPLORES", subject: "MINIATURE WORLDS" },
  "Portal Map": { verb: "EXPLORES", subject: "PORTALS & MAGIC" },
  "Star Catcher": { verb: "EXPLORES", subject: "STARS & FRIENDSHIP" },
}

export interface Tagline {
  verb: string
  subject: string
  color: string
}

/** Get display tagline for a story title */
export function getTagline(title: string): Tagline {
  const color = "text-amber-400"

  // Alphabet stories (check before general matching)
  if (title.includes("Alphabet") && title.includes("A -"))
    return { verb: "TEACHES", subject: "LETTERS A-I", color }
  if (title.includes("Alphabet") && title.includes("J"))
    return { verb: "TEACHES", subject: "LETTERS J-R", color }
  if (title.includes("Alphabet") && title.includes("S"))
    return { verb: "TEACHES", subject: "LETTERS S-Z", color }

  // Match by substring in title
  for (const [key, val] of Object.entries(TAGLINE_MAP)) {
    if (title.includes(key)) return { ...val, color }
  }

  return { verb: "EXPLORES", subject: "ADVENTURE", color }
}
