// Game economy constants
export const GAME_CONFIG = {
  // Weekly goal system (Motivation 3.0 - no daily pressure)
  WEEKLY_GOAL_ACTIVITIES: 5, // Target activities per week
  STREAK_MYSTERY_BOX_DAYS: 7, // Keep for backward compatibility
  DAILY_STREAK_XP: 50,
  DAILY_STREAK_EMERALDS: 5,

  // NOTE: Flawless bonus removed - external rewards undermine intrinsic motivation (Motivation 3.0)
  // FLAWLESS_MULTIPLIER: 2, // DEPRECATED - Do not use

  // Growth mindset messages - shown randomly after completing activities
  ENCOURAGEMENT_MESSAGES: [
    'Skvělá snaha! Každé cvičení tě posouvá dál.',
    'Vidím tvůj pokrok! Nevzdávej se.',
    'Chyby jsou součást učení. Jdeš na to správně!',
    'Tvoje vytrvalost se vyplácí!',
    'Líbí se mi, jak ses do toho pustil/a!',
    'Mozek roste, když se učíš nové věci!',
    'Další krok na cestě k mistrovství!',
  ],
} as const

// Get random encouragement message
export function getRandomEncouragement(): string {
  const messages = GAME_CONFIG.ENCOURAGEMENT_MESSAGES
  return messages[Math.floor(Math.random() * messages.length)]
}

// NOTE: Level system is now unified in levels.ts
// Use getLevelFromXp() from levels.ts or getLevelFromXpWithTheme() from themes.ts

// Mystery box reward tiers
export const MYSTERY_BOX_TIERS = {
  common: {
    chance: 0.6,
    rewards: [
      'Bonbon dle výběru',
      '10 minut extra na PC',
      'Výběr pohádky na večer',
      'Snídaně do postele',
    ],
  },
  rare: {
    chance: 0.3,
    rewards: [
      'Výběr večeře',
      'Vynechání jednoho úkolu',
      'Film dle výběru',
      '30 minut navíc před spaním',
    ],
  },
  legendary: {
    chance: 0.1,
    rewards: [
      'Výlet do kina',
      '100 Robuxů',
      'Nová hra dle výběru (do 500 Kč)',
      'Den bez povinností',
    ],
  },
} as const

// Default activities with Growth Mindset messaging
export const DEFAULT_ACTIVITIES = [
  {
    name: 'CERMAT Test (celý)',
    description: 'Vyzkoušej si kompletní test a zjisti, kde se můžeš zlepšit',
    why_learning: 'Každý test ti ukáže, co už umíš a kam směřovat dál. Chyby jsou součást učení!',
    xp_reward: 500,
    emerald_reward: 50,
    icon: 'scroll',
    requires_approval: true,
    requires_score: true,
    max_score: 50,
    flawless_threshold: 40,
  },
  {
    name: 'Scio Test',
    description: 'Trénuj logické myšlení a obecné dovednosti',
    why_learning: 'Logické myšlení ti pomůže řešit problémy nejen ve škole, ale i v životě!',
    xp_reward: 400,
    emerald_reward: 40,
    icon: 'brain',
    requires_approval: true,
    requires_score: true,
    max_score: 50,
    flawless_threshold: 40,
  },
  {
    name: 'Doučování (1 hodina)',
    description: 'Uč se s někým, kdo ti může pomoct pochopit těžší věci',
    why_learning: 'Ptát se je super! Nejlepší studenti se nebojí požádat o pomoc.',
    xp_reward: 200,
    emerald_reward: 20,
    icon: 'graduation-cap',
    requires_approval: true,
    requires_score: false,
    max_score: null,
    flawless_threshold: null,
  },
  {
    name: 'Domácí příprava (20 min)',
    description: 'Soustředěná práce - i malý krok vpřed se počítá',
    why_learning: '20 minut denně dělá velký rozdíl! Mozek se učí postupně.',
    xp_reward: 100,
    emerald_reward: 10,
    icon: 'book-open',
    requires_approval: true,
    requires_score: false,
    max_score: null,
    flawless_threshold: null,
  },
  {
    name: 'Oprava chyby',
    description: 'Rozbor chyby - nejlepší způsob, jak se posunout dál',
    why_learning: 'Chyby jsou učitelé! Když pochopíš, proč se stala, příště to zvládneš.',
    xp_reward: 50,
    emerald_reward: 5,
    icon: 'bug',
    requires_approval: true,
    requires_score: false,
    max_score: null,
    flawless_threshold: null,
  },
] as const

// Default shop items
export const DEFAULT_SHOP_ITEMS = [
  {
    name: 'Sladkost dle výběru',
    description: 'Bonbon, čokoláda nebo zmrzlina',
    price: 30,
    icon: 'candy',
  },
  {
    name: '30 min hraní',
    description: 'Extra čas na PC, tablet nebo konzoli',
    price: 50,
    icon: 'gamepad-2',
  },
  {
    name: 'Výběr filmu na večer',
    description: 'Ty vybíráš, co budeme koukat',
    price: 80,
    icon: 'film',
  },
  {
    name: 'Vynechání úkolu',
    description: 'Jeden domácí úkol ti odpustíme',
    price: 100,
    icon: 'sparkles',
  },
  {
    name: 'Výběr večeře',
    description: 'Dnes se vaří podle tebe',
    price: 150,
    icon: 'utensils',
  },
  {
    name: 'Pizza večer',
    description: 'Objednáváme pizzu!',
    price: 300,
    icon: 'pizza',
  },
  {
    name: '100 Kč kapesné',
    description: 'Extra peníze do prasátka',
    price: 500,
    icon: 'piggy-bank',
  },
  {
    name: 'Výlet dle výběru',
    description: 'Zoo, aquapark, nebo jiný výlet',
    price: 1000,
    icon: 'map',
  },
] as const

// NOTE: calculateLevel, calculateXpProgress, getLevelInfo removed
// Use getLevelFromXp/getLevelProgress from levels.ts instead

export function rollMysteryBox(): { tier: 'common' | 'rare' | 'legendary'; reward: string } {
  const roll = Math.random()

  if (roll < MYSTERY_BOX_TIERS.legendary.chance) {
    const rewards = MYSTERY_BOX_TIERS.legendary.rewards
    return { tier: 'legendary', reward: rewards[Math.floor(Math.random() * rewards.length)] }
  }

  if (roll < MYSTERY_BOX_TIERS.legendary.chance + MYSTERY_BOX_TIERS.rare.chance) {
    const rewards = MYSTERY_BOX_TIERS.rare.rewards
    return { tier: 'rare', reward: rewards[Math.floor(Math.random() * rewards.length)] }
  }

  const rewards = MYSTERY_BOX_TIERS.common.rewards
  return { tier: 'common', reward: rewards[Math.floor(Math.random() * rewards.length)] }
}

// Streak utilities
export interface StreakUpdate {
  newStreak: number
  newLongestStreak: number
  shouldReset: boolean
  isConsecutive: boolean
}

// Czech timezone for streak calculations
const CZ_TIMEZONE = 'Europe/Prague'

/**
 * Get today's date in Czech timezone as YYYY-MM-DD string
 */
function getTodayInCzechTimezone(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: CZ_TIMEZONE })
}

/**
 * Calculate days difference between two dates (in local CZ context)
 */
function getDaysDifference(dateString: string, todayString: string): number {
  const date = new Date(dateString + 'T00:00:00')
  const today = new Date(todayString + 'T00:00:00')
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Calculate streak update based on last activity date
 * @param lastActivityDate - ISO date string (YYYY-MM-DD) or null
 * @param currentStreak - Current streak count
 * @param longestStreak - Longest streak ever achieved
 * @returns StreakUpdate object with new values
 */
export function calculateStreakUpdate(
  lastActivityDate: string | null,
  currentStreak: number,
  longestStreak: number
): StreakUpdate {
  const today = getTodayInCzechTimezone()

  // If no previous activity, start streak at 1
  if (!lastActivityDate) {
    return {
      newStreak: 1,
      newLongestStreak: Math.max(longestStreak, 1),
      shouldReset: false,
      isConsecutive: true,
    }
  }

  // If already completed activity today, don't increment
  if (lastActivityDate === today) {
    return {
      newStreak: currentStreak,
      newLongestStreak: longestStreak,
      shouldReset: false,
      isConsecutive: false,
    }
  }

  // Calculate days difference using CZ timezone
  const diffDays = getDaysDifference(lastActivityDate, today)

  // Consecutive day (yesterday) - increment streak
  if (diffDays === 1) {
    const newStreak = currentStreak + 1
    return {
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      shouldReset: false,
      isConsecutive: true,
    }
  }

  // Missed days - reset streak to 1
  return {
    newStreak: 1,
    newLongestStreak: longestStreak,
    shouldReset: true,
    isConsecutive: false,
  }
}

/**
 * Get today's date in Czech timezone (for storing in DB)
 */
export function getTodayCzech(): string {
  return getTodayInCzechTimezone()
}

/**
 * Check if streak should be reset (when loading user data)
 * Returns true if more than 1 day has passed since last activity
 */
export function shouldResetStreak(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return false

  const today = getTodayInCzechTimezone()
  const diffDays = getDaysDifference(lastActivityDate, today)

  // Reset if more than 1 day has passed
  return diffDays > 1
}
