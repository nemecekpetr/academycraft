'use client'

import { motion } from 'framer-motion'
import { Compass, Star, Sparkles, Users } from 'lucide-react'
import type { FamilyAdventure as FamilyAdventureType } from '@/types/database'

interface FamilyAdventureProps {
  adventure: FamilyAdventureType | null
  userPoints?: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
}

// Icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
  star: <Star className="w-full h-full" />,
  compass: <Compass className="w-full h-full" />,
  sparkles: <Sparkles className="w-full h-full" />,
  users: <Users className="w-full h-full" />,
}

export default function FamilyAdventure({
  adventure,
  userPoints = 0,
  size = 'md',
  showProgress = true,
}: FamilyAdventureProps) {
  const sizes = {
    sm: { container: 'p-2', icon: 'w-6 h-6', text: 'text-sm', progress: 'h-2' },
    md: { container: 'p-3', icon: 'w-8 h-8', text: 'text-base', progress: 'h-3' },
    lg: { container: 'p-4', icon: 'w-10 h-10', text: 'text-lg', progress: 'h-4' },
  }

  // No active adventure
  if (!adventure) {
    return (
      <div className={`mc-panel mc-panel-dark ${sizes[size].container}`}>
        <div className="flex items-center gap-3">
          <div
            className={`${sizes[size].icon} text-[var(--foreground-muted)] flex items-center justify-center`}
          >
            <Compass className="w-full h-full opacity-50" />
          </div>
          <div className="flex-1">
            <p className={`${sizes[size].text} text-[var(--foreground-muted)]`}>
              Zatím nemáte rodinné dobrodružství
            </p>
            <p className="text-xs text-[var(--foreground-muted)] opacity-70">
              Rodič může vytvořit společný cíl
            </p>
          </div>
        </div>
      </div>
    )
  }

  const progress = Math.min(100, Math.round((adventure.points_current / adventure.points_needed) * 100))
  const isAchieved = adventure.status === 'achieved'

  return (
    <motion.div
      className={`mc-panel mc-panel-dark ${sizes[size].container}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <motion.div
          className={`${sizes[size].icon} text-[var(--theme-accent)] flex items-center justify-center`}
          animate={isAchieved ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
          transition={{ repeat: isAchieved ? Infinity : 0, duration: 2, repeatDelay: 3 }}
        >
          {ICON_MAP[adventure.icon] || <Star className="w-full h-full" />}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`${sizes[size].text} font-bold truncate`}>
              {adventure.name}
            </h3>
            {isAchieved && (
              <motion.span
                className="text-xs bg-[var(--theme-accent)] text-black px-1.5 py-0.5 rounded"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                Dosaženo!
              </motion.span>
            )}
          </div>

          {adventure.description && size !== 'sm' && (
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2">
              {adventure.description}
            </p>
          )}

          {/* Progress bar */}
          {showProgress && !isAchieved && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--foreground-muted)] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Společný cíl
                </span>
                <span className="text-[var(--theme-accent)]">
                  {adventure.points_current} / {adventure.points_needed}
                </span>
              </div>
              <div
                className={`bg-black/30 rounded-full overflow-hidden ${sizes[size].progress}`}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Achieved celebration */}
          {isAchieved && (
            <motion.div
              className="mt-2 flex items-center gap-2 text-[var(--theme-accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Rodina to dokázala!</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* User contribution hint */}
      {!isAchieved && userPoints > 0 && size !== 'sm' && (
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-[var(--foreground-muted)]">
          Tvůj příspěvek: <span className="text-[var(--theme-primary)]">{userPoints} bodů</span>
        </div>
      )}
    </motion.div>
  )
}
