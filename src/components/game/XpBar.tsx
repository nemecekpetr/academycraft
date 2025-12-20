'use client'

import { motion } from 'framer-motion'
import { calculateXpProgress, calculateLevel, getLevelInfo } from '@/lib/constants'

interface XpBarProps {
  xp: number
  showLevel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function XpBar({ xp, showLevel = true, size = 'md' }: XpBarProps) {
  const progress = calculateXpProgress(xp)
  const level = calculateLevel(xp)
  const levelInfo = getLevelInfo(level)

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
            style={{ color: levelInfo.color, textShadow: `0 0 10px ${levelInfo.color}` }}
          >
            Level {level}: {levelInfo.title}
          </span>
          <span className="text-xs text-[var(--foreground-muted)]">
            {progress.current} / {progress.needed} XP
          </span>
        </div>
      )}

      <div className={`xp-bar-container ${heights[size]}`}>
        <motion.div
          className="xp-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {size !== 'sm' && (
          <span className="xp-bar-text">
            {Math.round(progress.percentage)}%
          </span>
        )}
      </div>
    </div>
  )
}
