'use client'

import { Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { GAME_CONFIG } from '@/lib/constants'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const daysUntilBox = GAME_CONFIG.STREAK_MYSTERY_BOX_DAYS - (streak % GAME_CONFIG.STREAK_MYSTERY_BOX_DAYS)
  const isNearBox = daysUntilBox <= 2

  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
    md: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-3 py-1.5' },
    lg: { icon: 'w-6 h-6', text: 'text-lg', padding: 'px-4 py-2' },
  }

  const getFlameColor = () => {
    if (streak >= 30) return '#FF55FF' // Legendary purple
    if (streak >= 14) return '#55FFFF' // Rare cyan
    if (streak >= 7) return '#FCEE4B' // Gold
    return '#FF6B35' // Orange
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 mc-panel-dark mc-panel ${sizes[size].padding}`}
      animate={isNearBox ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isNearBox ? Infinity : 0, duration: 1 }}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <Flame
          className={sizes[size].icon}
          style={{ color: getFlameColor(), filter: `drop-shadow(0 0 5px ${getFlameColor()})` }}
        />
      </motion.div>
      <span className={`${sizes[size].text} font-bold`} style={{ color: getFlameColor() }}>
        {streak}
      </span>
      {isNearBox && streak > 0 && (
        <span className="text-xs text-[var(--foreground-muted)] ml-1">
          ({daysUntilBox} do boxu!)
        </span>
      )}
    </motion.div>
  )
}
