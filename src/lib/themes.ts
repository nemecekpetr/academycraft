// Theme system - visual styles for the app
// Imports base levels from levels.ts and adds theme-specific names/icons

import { LEVELS, Level } from './levels'

export type ThemeId = 'minecraft' | 'unicorn' | 'kpop'

export interface ThemeLevel {
  level: number
  name: string
  minXp: number
  icon: string
  color: string
}

// Theme-specific level name overrides (icons and colors can also be overridden)
interface ThemeLevelOverride {
  name: string
  icon?: string
  color?: string
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
  // Level overrides - uses base LEVELS from levels.ts, allows name/icon/color overrides
  levelOverrides: Record<number, ThemeLevelOverride>
}

// Helper to build theme levels from base LEVELS + theme overrides
function buildThemeLevels(overrides: Record<number, ThemeLevelOverride>): ThemeLevel[] {
  return LEVELS.map(baseLevel => {
    const override = overrides[baseLevel.level]
    return {
      level: baseLevel.level,
      minXp: baseLevel.minXp, // Always from base LEVELS
      name: override?.name ?? baseLevel.name,
      icon: override?.icon ?? baseLevel.icon,
      color: override?.color ?? baseLevel.color,
    }
  })
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
    // Minecraft uses default level names from levels.ts
    levelOverrides: {},
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
    // Unicorn theme level overrides
    levelOverrides: {
      1: { name: 'Hvězdička', icon: '✨', color: '#FFB6C1' },
      2: { name: 'Víla', icon: '🧚', color: '#DDA0DD' },
      3: { name: 'Princezna', icon: '👸', color: '#FF69B4' },
      4: { name: 'Kouzelnice', icon: '🔮', color: '#BA55D3' },
      5: { name: 'Královna', icon: '👑', color: '#FFD700' },
      6: { name: 'Bohyně', icon: '🦄', color: '#FF1493' },
    },
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
    // K-pop theme level overrides
    levelOverrides: {
      1: { name: 'Trainee', icon: '🎵', color: '#94A3B8' },
      2: { name: 'Rookie', icon: '🎤', color: '#60A5FA' },
      3: { name: 'Idol', icon: '💫', color: '#FF4D8D' },
      4: { name: 'Star', icon: '⭐', color: '#FBBF24' },
      5: { name: 'Superstar', icon: '🌟', color: '#F472B6' },
      6: { name: 'Legend', icon: '👑', color: '#FFD700' },
    },
  },
}

// Cache for built theme levels to avoid rebuilding on every call
const themeLevelsCache = new Map<ThemeId, ThemeLevel[]>()

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
 * Get theme levels (built from base LEVELS + theme overrides)
 * Results are cached for performance
 */
export function getThemeLevels(themeId: ThemeId | string | null): ThemeLevel[] {
  const resolvedThemeId = (themeId && themeId in THEMES ? themeId : DEFAULT_THEME) as ThemeId

  if (!themeLevelsCache.has(resolvedThemeId)) {
    const theme = THEMES[resolvedThemeId]
    themeLevelsCache.set(resolvedThemeId, buildThemeLevels(theme.levelOverrides))
  }

  return themeLevelsCache.get(resolvedThemeId)!
}

/**
 * Get level from XP for a specific theme
 */
export function getLevelFromXpWithTheme(xp: number, themeId: ThemeId | string | null): ThemeLevel {
  const levels = getThemeLevels(themeId)
  let currentLevel = levels[0]

  for (const level of levels) {
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
  const levels = getThemeLevels(themeId)
  const currentLevel = getLevelFromXpWithTheme(xp, themeId)
  const nextLevelIndex = levels.findIndex(l => l.level === currentLevel.level) + 1

  if (nextLevelIndex >= levels.length) {
    return null
  }

  return levels[nextLevelIndex]
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
