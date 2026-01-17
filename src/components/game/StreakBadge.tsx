'use client'

import { Flame } from 'lucide-react'
import { motion } from 'framer-motion'

interface StreakBadgeProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

/**
 * StreakBadge - Shows learning consistency without countdown pressure (Motivation 3.0)
 * The streak is shown as a celebration of consistency, NOT as a countdown to rewards.
 */
export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
    md: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-3 py-1.5' },
    lg: { icon: 'w-6 h-6', text: 'text-lg', padding: 'px-4 py-2' },
  }

  const getFlameColor = () => {
    if (streak >= 30) return '#FF55FF' // Legendary purple - long-term dedication
    if (streak >= 14) return '#55FFFF' // Rare cyan - growing consistency
    if (streak >= 7) return '#FCEE4B' // Gold - building rhythm
    return '#FF6B35' // Orange - getting started
  }

  return (
    <motion.div
      className={`inline-flex items-center gap-1.5 mc-panel-dark mc-panel ${sizes[size].padding}`}
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
      {/* NOTE: Removed countdown to mystery box - Motivation 3.0 principle:
          External reward countdowns undermine intrinsic motivation */}
    </motion.div>
  )
}
