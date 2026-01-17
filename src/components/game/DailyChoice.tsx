'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight, Star, Scroll, Brain, GraduationCap, BookOpen, Bug, type LucideProps } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { Activity } from '@/types/database'

interface DailyChoiceProps {
  activities: Activity[]
  onSelectActivity: (activity: Activity) => void
}

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  scroll: Scroll,
  brain: Brain,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  bug: Bug,
  star: Star,
}

// Check if string is an emoji
function isEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(str)
}

// Icon component that handles both Lucide icons and emoji
function ActivityIcon({ icon, color }: { icon: string; color: string }) {
  if (isEmoji(icon)) {
    return <span className="text-2xl">{icon}</span>
  }

  const Icon = iconMap[icon] || Star
  return <Icon className="w-6 h-6" style={{ color }} />
}

// Shuffle array using seeded random (same selection per day)
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  let m = shuffled.length
  while (m) {
    const i = Math.floor(seedRandom(seed + m) * m--)
    ;[shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]]
  }
  return shuffled
}

function seedRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Get today's date as seed
function getTodaySeed(): number {
  const today = new Date()
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
}

export default function DailyChoice({ activities, onSelectActivity }: DailyChoiceProps) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(true)

  // Get 3 random activities for today (consistent per day)
  const todaySeed = getTodaySeed()
  const shuffled = seededShuffle(activities, todaySeed)
  const todaysChoices = shuffled.slice(0, 3)

  if (activities.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl overflow-hidden"
      style={{
        backgroundColor: theme.colors.card,
        border: `2px solid ${theme.colors.primary}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
        style={{ backgroundColor: `${theme.colors.primary}15` }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <span className="font-bold" style={{ color: theme.colors.text }}>
            Dnešní výběr
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            backgroundColor: theme.colors.primary,
            color: '#fff'
          }}>
            Vyber si!
          </span>
        </div>
        <ChevronRight
          className="w-5 h-5 transition-transform"
          style={{
            color: theme.colors.textMuted,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Choices */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4"
        >
          <p className="text-xs mb-4" style={{ color: theme.colors.textMuted }}>
            Co tě dnes láká? Ty rozhoduješ!
          </p>

          <div className="space-y-2">
            {todaysChoices.map((activity, index) => (
              <motion.button
                key={activity.id}
                onClick={() => onSelectActivity(activity)}
                className="w-full p-4 rounded-xl flex items-center gap-3 transition-all"
                style={{
                  backgroundColor: theme.colors.backgroundLight,
                  border: `2px solid transparent`,
                }}
                whileHover={{
                  scale: 1.02,
                  borderColor: theme.colors.primary,
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <ActivityIcon icon={activity.icon} color={theme.colors.primary} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-sm" style={{ color: theme.colors.text }}>
                    {activity.name}
                  </p>
                  {activity.description && (
                    <p className="text-xs truncate" style={{ color: theme.colors.textMuted }}>
                      {activity.description}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div
                  className="flex-shrink-0 px-2 py-1 rounded-lg text-center"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <span className="font-bold text-sm" style={{ color: theme.colors.primary }}>
                    +{activity.adventure_points}
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: theme.colors.textMuted }} />
              </motion.button>
            ))}
          </div>

          {/* Show all option */}
          <p className="text-xs text-center mt-4" style={{ color: theme.colors.textMuted }}>
            Nebo si vyber z kompletního seznamu níže
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
