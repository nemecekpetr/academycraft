// Level system configuration - SINGLE SOURCE OF TRUTH
// All level XP thresholds are defined here. Themes can override names/icons.

export interface Level {
  level: number
  name: string
  nameEn: string
  minXp: number
  icon: string
  color: string
}

// Base levels - XP thresholds are authoritative
export const LEVELS: Level[] = [
  { level: 1, name: 'Nováček', nameEn: 'Novice', minXp: 0, icon: '🌱', color: '#AAAAAA' },
  { level: 2, name: 'Učedník', nameEn: 'Apprentice', minXp: 100, icon: '📚', color: '#5D8C3E' },
  { level: 3, name: 'Průzkumník', nameEn: 'Explorer', minXp: 300, icon: '🧭', color: '#4AEDD9' },
  { level: 4, name: 'Válečník', nameEn: 'Warrior', minXp: 600, icon: '⚔️', color: '#FCEE4B' },
  { level: 5, name: 'Mistr', nameEn: 'Master', minXp: 1000, icon: '👑', color: '#FF9500' },
  { level: 6, name: 'Legenda', nameEn: 'Legend', minXp: 2000, icon: '⭐', color: '#FF55FF' },
]

// Maximum level
export const MAX_LEVEL = LEVELS.length

/**
 * Get level info based on XP amount
 */
export function getLevelFromXp(xp: number): Level {
  let currentLevel = LEVELS[0]

  for (const level of LEVELS) {
    if (xp >= level.minXp) {
      currentLevel = level
    } else {
      break
    }
  }

  return currentLevel
}

/**
 * Get next level info (or null if max level)
 */
export function getNextLevel(xp: number): Level | null {
  const currentLevel = getLevelFromXp(xp)
  const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level) + 1

  if (nextLevelIndex >= LEVELS.length) {
    return null
  }

  return LEVELS[nextLevelIndex]
}

/**
 * Calculate progress to next level (0-100)
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = getLevelFromXp(xp)
  const nextLevel = getNextLevel(xp)

  if (!nextLevel) {
    return 100 // Max level reached
  }

  const xpInCurrentLevel = xp - currentLevel.minXp
  const xpNeededForNextLevel = nextLevel.minXp - currentLevel.minXp

  return Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)
}

/**
 * Get XP needed for next level
 */
export function getXpToNextLevel(xp: number): number | null {
  const nextLevel = getNextLevel(xp)

  if (!nextLevel) {
    return null
  }

  return nextLevel.minXp - xp
}
