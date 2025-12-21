// Theme system - visual styles for the app

export type ThemeId = 'minecraft' | 'unicorn' | 'kpop'

export interface ThemeLevel {
  level: number
  name: string
  minXp: number
  icon: string
  color: string
}

export interface ThemeIcons {
  home: string
  quests: string
  shop: string
  profile: string
  currency: string
  xp: string
}

export interface Theme {
  id: ThemeId
  name: string
  description: string
  icon: string
  font: {
    heading: string
    body: string
  }
  icons: ThemeIcons
  colors: {
    primary: string
    secondary: string
    accent: string
    xp: string
    currency: string
    currencyName: string
    background: string
    backgroundLight: string
    card: string
    text: string
    textMuted: string
  }
  levels: ThemeLevel[]
}

export const THEMES: Record<ThemeId, Theme> = {
  minecraft: {
    id: 'minecraft',
    name: 'Minecraft',
    description: 'Bloky, smaragdy a dobrodružství',
    icon: '⛏️',
    font: {
      heading: "'Pixelify Sans', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
    },
    icons: {
      home: '🏠',
      quests: '📜',
      shop: '🛒',
      profile: '👤',
      currency: '💎',
      xp: '⭐',
    },
    colors: {
      primary: '#17DD62',
      secondary: '#5D8C3E',
      accent: '#FCEE4B',
      xp: '#7EFC20',
      currency: '#17DD62',
      currencyName: 'Smaragdy',
      background: '#2D2D2D',
      backgroundLight: '#3D3D3D',
      card: '#1A1A1A',
      text: '#FFFFFF',
      textMuted: '#AAAAAA',
    },
    levels: [
      { level: 1, name: 'Nováček', minXp: 0, icon: '🌱', color: '#AAAAAA' },
      { level: 2, name: 'Učedník', minXp: 100, icon: '📚', color: '#5D8C3E' },
      { level: 3, name: 'Průzkumník', minXp: 300, icon: '🧭', color: '#4AEDD9' },
      { level: 4, name: 'Válečník', minXp: 600, icon: '⚔️', color: '#FCEE4B' },
      { level: 5, name: 'Mistr', minXp: 1000, icon: '👑', color: '#FF9500' },
      { level: 6, name: 'Legenda', minXp: 2000, icon: '⭐', color: '#FF55FF' },
    ],
  },
  unicorn: {
    id: 'unicorn',
    name: 'Jednorožec',
    description: 'Magický svět plný třpytek a duhy',
    icon: '🦄',
    font: {
      heading: "'Inter', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
    },
    icons: {
      home: '🏰',
      quests: '✨',
      shop: '🎁',
      profile: '👸',
      currency: '⭐',
      xp: '💖',
    },
    colors: {
      primary: '#D946A0',
      secondary: '#9333EA',
      accent: '#F59E0B',
      xp: '#C026D3',
      currency: '#7C3AED',
      currencyName: 'Hvězdičky',
      background: '#FDF2F8',
      backgroundLight: '#FCE7F3',
      card: '#FFFFFF',
      text: '#1F0A1C',
      textMuted: '#6B3A60',
    },
    levels: [
      { level: 1, name: 'Hvězdička', minXp: 0, icon: '✨', color: '#FFB6C1' },
      { level: 2, name: 'Víla', minXp: 100, icon: '🧚', color: '#DDA0DD' },
      { level: 3, name: 'Princezna', minXp: 300, icon: '👸', color: '#FF69B4' },
      { level: 4, name: 'Kouzelnice', minXp: 600, icon: '🔮', color: '#BA55D3' },
      { level: 5, name: 'Královna', minXp: 1000, icon: '👑', color: '#FFD700' },
      { level: 6, name: 'Bohyně', minXp: 2000, icon: '🦄', color: '#FF1493' },
    ],
  },
  kpop: {
    id: 'kpop',
    name: 'K-pop Star',
    description: 'Cesta od trainee k superstar',
    icon: '🎤',
    font: {
      heading: "'Montserrat', 'Arial Black', sans-serif",
      body: "'Montserrat', system-ui, sans-serif",
    },
    icons: {
      home: '🏠',
      quests: '🎯',
      shop: '💎',
      profile: '🌟',
      currency: '💜',
      xp: '💗',
    },
    colors: {
      primary: '#FF4D8D',
      secondary: '#8B5CF6',
      accent: '#FFD700',
      xp: '#FF69B4',
      currency: '#8B5CF6',
      currencyName: 'Gems',
      background: '#0D0D0D',
      backgroundLight: '#1A1A2E',
      card: '#0F0F1A',
      text: '#FFFFFF',
      textMuted: '#A0A0B0',
    },
    levels: [
      { level: 1, name: 'Trainee', minXp: 0, icon: '🎵', color: '#94A3B8' },
      { level: 2, name: 'Rookie', minXp: 100, icon: '🎤', color: '#60A5FA' },
      { level: 3, name: 'Idol', minXp: 300, icon: '💫', color: '#FF4D8D' },
      { level: 4, name: 'Star', minXp: 600, icon: '⭐', color: '#FBBF24' },
      { level: 5, name: 'Superstar', minXp: 1000, icon: '🌟', color: '#F472B6' },
      { level: 6, name: 'Legend', minXp: 2000, icon: '👑', color: '#FFD700' },
    ],
  },
}

export const DEFAULT_THEME: ThemeId = 'minecraft'

/**
 * Get theme by ID
 */
export function getTheme(themeId: ThemeId | string | null): Theme {
  if (themeId && themeId in THEMES) {
    return THEMES[themeId as ThemeId]
  }
  return THEMES[DEFAULT_THEME]
}

/**
 * Get level from XP for a specific theme
 */
export function getLevelFromXpWithTheme(xp: number, themeId: ThemeId | string | null): ThemeLevel {
  const theme = getTheme(themeId)
  let currentLevel = theme.levels[0]

  for (const level of theme.levels) {
    if (xp >= level.minXp) {
      currentLevel = level
    } else {
      break
    }
  }

  return currentLevel
}

/**
 * Get next level for a specific theme
 */
export function getNextLevelWithTheme(xp: number, themeId: ThemeId | string | null): ThemeLevel | null {
  const theme = getTheme(themeId)
  const currentLevel = getLevelFromXpWithTheme(xp, themeId)
  const nextLevelIndex = theme.levels.findIndex(l => l.level === currentLevel.level) + 1

  if (nextLevelIndex >= theme.levels.length) {
    return null
  }

  return theme.levels[nextLevelIndex]
}

/**
 * Calculate progress to next level (0-100) for a specific theme
 */
export function getLevelProgressWithTheme(xp: number, themeId: ThemeId | string | null): number {
  const currentLevel = getLevelFromXpWithTheme(xp, themeId)
  const nextLevel = getNextLevelWithTheme(xp, themeId)

  if (!nextLevel) {
    return 100
  }

  const xpInCurrentLevel = xp - currentLevel.minXp
  const xpNeededForNextLevel = nextLevel.minXp - currentLevel.minXp

  return Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)
}

/**
 * Get XP needed for next level
 */
export function getXpToNextLevelWithTheme(xp: number, themeId: ThemeId | string | null): number | null {
  const nextLevel = getNextLevelWithTheme(xp, themeId)

  if (!nextLevel) {
    return null
  }

  return nextLevel.minXp - xp
}
