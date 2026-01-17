'use client'

import { motion } from 'framer-motion'
import { Calendar, Check, Sun, Moon, Sparkles } from 'lucide-react'
import type { LearningDay } from '@/types/database'
import { RHYTHM_MILESTONES, type RhythmMilestone } from '@/types/database'

interface LearningWeekProps {
  learningDays: LearningDay[]
  weeklyGoalDays?: number
  rhythmMilestone?: RhythmMilestone
  weeksToShow?: number
}

// Get start of week (Monday) for a date
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Get day names in Czech
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export default function LearningWeek({
  learningDays,
  weeklyGoalDays = 3,
  rhythmMilestone,
  weeksToShow = 4,
}: LearningWeekProps) {
  // Create a set of learning dates for quick lookup
  const learningDatesSet = new Set(learningDays.map((d) => d.learning_date))

  // Generate weeks array
  const today = new Date()
  const weeks: Date[][] = []

  for (let w = 0; w < weeksToShow; w++) {
    const weekStart = getWeekStart(new Date(today.getTime() - w * 7 * 24 * 60 * 60 * 1000))
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + d)
      week.push(day)
    }
    weeks.push(week)
  }

  // Reverse so oldest week is first
  weeks.reverse()

  // Count active days this week
  const currentWeekStart = getWeekStart(today)
  const currentWeekDays = learningDays.filter((d) => {
    const date = new Date(d.learning_date)
    return date >= currentWeekStart
  }).length

  const goalProgress = Math.min(100, Math.round((currentWeekDays / weeklyGoalDays) * 100))
  const goalMet = currentWeekDays >= weeklyGoalDays

  return (
    <div className="mc-panel mc-panel-dark p-4">
      {/* Header with goal */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--theme-primary)]" />
          <h3 className="font-bold">Můj rytmus učení</h3>
        </div>
        <div className="text-sm">
          <span
            className={goalMet ? 'text-[var(--theme-accent)]' : 'text-[var(--foreground-muted)]'}
          >
            {currentWeekDays} / {weeklyGoalDays} dní tento týden
          </span>
          {goalMet && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-1"
            >
              <Check className="w-4 h-4 inline text-[var(--theme-accent)]" />
            </motion.span>
          )}
        </div>
      </div>

      {/* Weekly goal progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)]"
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-center text-xs ${
              i >= 5 ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground-muted)]'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const dateStr = formatDate(day)
              const isActive = learningDatesSet.has(dateStr)
              const isToday = formatDate(today) === dateStr
              const isFuture = day > today
              const isWeekend = dayIndex >= 5

              return (
                <motion.div
                  key={dateStr}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-xs
                    ${isActive ? 'bg-[var(--theme-primary)]' : 'bg-black/20'}
                    ${isToday ? 'ring-2 ring-[var(--theme-accent)]' : ''}
                    ${isFuture ? 'opacity-30' : ''}
                    ${isWeekend && !isActive ? 'opacity-50' : ''}
                  `}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: isFuture ? 0.3 : 1 }}
                  transition={{ delay: weekIndex * 0.05 + dayIndex * 0.02 }}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Check className="w-3 h-3 text-black" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Rhythm milestone */}
      {rhythmMilestone && RHYTHM_MILESTONES[rhythmMilestone] && (
        <motion.div
          className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-lg">{RHYTHM_MILESTONES[rhythmMilestone].icon}</span>
          <div>
            <p className="text-sm font-bold text-[var(--theme-accent)]">
              {RHYTHM_MILESTONES[rhythmMilestone].name}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {RHYTHM_MILESTONES[rhythmMilestone].description}
            </p>
          </div>
        </motion.div>
      )}

      {/* No punishment message */}
      {currentWeekDays === 0 && (
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">
            Vítej zpět! Připravená pokračovat?
          </p>
        </div>
      )}
    </div>
  )
}
