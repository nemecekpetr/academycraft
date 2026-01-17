'use client'

import { motion } from 'framer-motion'
import { Star, Calculator, BookOpen, Brain } from 'lucide-react'
import type { SkillProgressWithArea } from '@/types/database'
import { MASTERY_LEVELS, type MasteryLevel } from '@/types/database'

interface SkillConstellationProps {
  skillProgress: SkillProgressWithArea[]
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Icon mapping for skill areas
const SKILL_ICONS: Record<string, React.ReactNode> = {
  calculator: <Calculator className="w-full h-full" />,
  'book-open': <BookOpen className="w-full h-full" />,
  brain: <Brain className="w-full h-full" />,
  star: <Star className="w-full h-full" />,
}

// Number of stars per mastery level
const STARS_PER_LEVEL: Record<MasteryLevel, number> = {
  exploring: 1,
  growing: 2,
  confident: 3,
  teaching: 4,
}

interface StarClusterProps {
  count: number
  color: string
  size: 'sm' | 'md' | 'lg'
}

function StarCluster({ count, color, size }: StarClusterProps) {
  const starSize = { sm: 12, md: 16, lg: 20 }[size]
  const positions = [
    { x: 0, y: -10 },
    { x: 10, y: 5 },
    { x: -10, y: 5 },
    { x: 0, y: 10 },
  ]

  return (
    <div className="relative" style={{ width: starSize * 2.5, height: starSize * 2.5 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${positions[i].x}px, ${positions[i].y}px)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: i < count ? 1 : 0.3,
            opacity: i < count ? 1 : 0.2,
          }}
          transition={{ delay: i * 0.1, type: 'spring' }}
        >
          <Star
            style={{
              width: starSize,
              height: starSize,
              fill: i < count ? color : 'transparent',
              color: i < count ? color : '#444',
              filter: i < count ? `drop-shadow(0 0 4px ${color})` : 'none',
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default function SkillConstellation({
  skillProgress,
  showDetails = true,
  size = 'md',
}: SkillConstellationProps) {
  const containerPadding = { sm: 'p-2', md: 'p-4', lg: 'p-6' }[size]
  const titleSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }[size]
  const iconSize = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]

  // If no progress data, show empty state
  if (!skillProgress || skillProgress.length === 0) {
    return (
      <div className={`mc-panel mc-panel-dark ${containerPadding}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-[var(--theme-primary)]" />
          <h3 className={`font-bold ${titleSize}`}>Moje souhvězdí dovedností</h3>
        </div>
        <p className="text-center text-[var(--foreground-muted)] py-4">
          Tvoje cesta teprve začíná! Dokončením aktivit rozsvítíš první hvězdy.
        </p>
      </div>
    )
  }

  return (
    <div className={`mc-panel mc-panel-dark ${containerPadding}`}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-[var(--theme-primary)]" />
        <h3 className={`font-bold ${titleSize}`}>Moje souhvězdí dovedností</h3>
      </div>

      <div className="space-y-4">
        {skillProgress.map((progress, index) => {
          const skillArea = progress.skill_area
          const masteryInfo = MASTERY_LEVELS[progress.mastery_level]
          const starCount = STARS_PER_LEVEL[progress.mastery_level]
          const color = skillArea?.color || masteryInfo.color

          return (
            <motion.div
              key={progress.id}
              className="flex items-center gap-4 p-3 bg-black/20 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Skill icon */}
              <div
                className={`${iconSize} flex-shrink-0`}
                style={{ color }}
              >
                {SKILL_ICONS[skillArea?.icon || 'star'] || <Star className="w-full h-full" />}
              </div>

              {/* Skill info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold" style={{ color }}>
                  {skillArea?.name || 'Neznámá oblast'}
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: masteryInfo.color }}>
                    {masteryInfo.icon} {masteryInfo.name}
                  </span>
                  {showDetails && (
                    <span className="text-[var(--foreground-muted)]">
                      ({progress.activities_completed} aktivit)
                    </span>
                  )}
                </div>
                {showDetails && (
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    {masteryInfo.description}
                  </p>
                )}
              </div>

              {/* Star cluster */}
              <StarCluster count={starCount} color={color} size={size} />
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      {showDetails && size !== 'sm' && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-[var(--foreground-muted)] mb-2">Úrovně mistrovství:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {(Object.entries(MASTERY_LEVELS) as [MasteryLevel, typeof MASTERY_LEVELS[MasteryLevel]][]).map(
              ([level, info]) => (
                <div key={level} className="flex items-center gap-1">
                  <span>{info.icon}</span>
                  <span style={{ color: info.color }}>{info.name}</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
