'use client'

import { motion } from 'framer-motion'
import { Target, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { GAME_CONFIG } from '@/lib/constants'

interface WeeklyProgressProps {
  completedThisWeek: number
  weeklyGoal?: number
}

export default function WeeklyProgress({
  completedThisWeek,
  weeklyGoal = GAME_CONFIG.WEEKLY_GOAL_ACTIVITIES,
}: WeeklyProgressProps) {
  const { theme } = useTheme()
  const progress = Math.min((completedThisWeek / weeklyGoal) * 100, 100)
  const isGoalMet = completedThisWeek >= weeklyGoal

  // Growth Mindset messages based on progress
  const getMessage = () => {
    if (isGoalMet) return 'Skvělá práce tento týden!'
    if (completedThisWeek === 0) return 'Každý krok se počítá!'
    if (progress < 50) return 'Dobrý začátek, pokračuj!'
    if (progress < 100) return 'Už jsi skoro tam!'
    return 'Jdeš na to skvěle!'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl"
      style={{
        backgroundColor: theme.colors.card,
        border: `2px solid ${isGoalMet ? theme.colors.primary : theme.colors.backgroundLight}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isGoalMet ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: theme.colors.primary }} />
          ) : (
            <Target className="w-5 h-5" style={{ color: theme.colors.accent }} />
          )}
          <span className="font-bold" style={{ color: theme.colors.text }}>
            Týdenní cíl
          </span>
        </div>
        <span
          className="text-sm font-bold"
          style={{ color: isGoalMet ? theme.colors.primary : theme.colors.textMuted }}
        >
          {completedThisWeek}/{weeklyGoal}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-3 rounded-full overflow-hidden mb-2"
        style={{ backgroundColor: theme.colors.backgroundLight }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            backgroundColor: isGoalMet ? theme.colors.primary : theme.colors.accent,
          }}
        />
      </div>

      {/* Motivational Message - Growth Mindset */}
      <p className="text-xs text-center" style={{ color: theme.colors.textMuted }}>
        {getMessage()}
      </p>

      {/* Activity dots */}
      <div className="flex justify-center gap-1 mt-3">
        {Array.from({ length: weeklyGoal }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                i < completedThisWeek
                  ? theme.colors.primary
                  : theme.colors.backgroundLight,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
