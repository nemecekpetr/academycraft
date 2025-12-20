// Game economy constants
export const GAME_CONFIG = {
  // XP per level
  XP_PER_LEVEL: 1000,

  // Streak bonuses
  STREAK_MYSTERY_BOX_DAYS: 7,
  DAILY_STREAK_XP: 50,
  DAILY_STREAK_EMERALDS: 5,

  // Flawless victory bonus (2x emeralds)
  FLAWLESS_MULTIPLIER: 2,
} as const

// Level titles based on Minecraft armor progression
export const LEVEL_TITLES = [
  { min: 1, max: 10, title: 'Nováček', armor: 'leather', color: '#8B4513' },
  { min: 11, max: 20, title: 'Železný Scholar', armor: 'iron', color: '#C0C0C0' },
  { min: 21, max: 30, title: 'Diamantový Expert', armor: 'diamond', color: '#00CED1' },
  { min: 31, max: 40, title: 'Netheritový Mistr', armor: 'netherite', color: '#4A4A4A' },
  { min: 41, max: 50, title: 'CERMAT Slayer', armor: 'enchanted', color: '#9932CC' },
] as const

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

// Default activities
export const DEFAULT_ACTIVITIES = [
  {
    name: 'CERMAT Test (celý)',
    description: 'Kompletní přijímací test v časovém limitu',
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
    description: 'Test obecných studijních předpokladů',
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
    description: 'Účast na doučování - online nebo osobně',
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
    description: 'Soustředěná práce na procvičování',
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
    description: 'Analýza a pochopení vlastní chyby',
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

// Helper functions
export function calculateLevel(xp: number): number {
  return Math.floor(xp / GAME_CONFIG.XP_PER_LEVEL) + 1
}

export function calculateXpProgress(xp: number): { current: number; needed: number; percentage: number } {
  const currentLevelXp = xp % GAME_CONFIG.XP_PER_LEVEL
  return {
    current: currentLevelXp,
    needed: GAME_CONFIG.XP_PER_LEVEL,
    percentage: (currentLevelXp / GAME_CONFIG.XP_PER_LEVEL) * 100,
  }
}

export function getLevelInfo(level: number) {
  return LEVEL_TITLES.find((t) => level >= t.min && level <= t.max) || LEVEL_TITLES[LEVEL_TITLES.length - 1]
}

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
