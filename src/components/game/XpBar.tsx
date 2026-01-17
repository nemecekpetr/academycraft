'use client'

import { motion } from 'framer-motion'
import { getLevelFromXp, getLevelProgress, getNextLevel } from '@/lib/levels'

interface XpBarProps {
  xp: number
  showLevel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function XpBar({ xp, showLevel = true, size = 'md' }: XpBarProps) {
  const level = getLevelFromXp(xp)
  const nextLevel = getNextLevel(xp)
  const progress = getLevelProgress(xp)

  // Calculate XP display values
  const xpInLevel = xp - level.minXp
  const xpNeeded = nextLevel ? nextLevel.minXp - level.minXp : 0

  const heights = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
  }

  return (
    <div className="w-full">
      {showLevel && (
        <div className="flex justify-between items-center mb-1">
          <span
            className="text-sm font-bold"
            style={{ color: level.color, textShadow: `0 0 10px ${level.color}` }}
          >
            Level {level.level}: {level.name}
          </span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {nextLevel ? `${xpInLevel} / ${xpNeeded} XP` : 'MAX'}
          </span>
        </div>
      )}

      <div className={`xp-bar-container ${heights[size]}`}>
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {size !== 'sm' && (
          <span className="xp-bar-text">
            {progress}%
          </span>
        )}
      </div>
    </div>
  )
}
