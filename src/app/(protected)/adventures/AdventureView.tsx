'use client'

import { motion } from 'framer-motion'
import { Compass, Trophy, Users, Sparkles, MapPin, Star, ChefHat, Film, Trees, Heart } from 'lucide-react'
import FamilyAdventure from '@/components/game/FamilyAdventure'
import type { FamilyAdventure as FamilyAdventureType, AdventureContribution, AdventureTemplate } from '@/types/database'

interface AdventureViewProps {
  activeAdventure: FamilyAdventureType | null
  achievedAdventures: FamilyAdventureType[]
  contributions: (AdventureContribution & { adventure?: FamilyAdventureType })[]
  templates: AdventureTemplate[]
  userPoints: number
  totalContribution: number
  hasParent: boolean
}

// Icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
  star: <Star className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
  dice: <Sparkles className="w-5 h-5" />,
  'chef-hat': <ChefHat className="w-5 h-5" />,
  film: <Film className="w-5 h-5" />,
  trees: <Trees className="w-5 h-5" />,
  'map-pin': <MapPin className="w-5 h-5" />,
}

export default function AdventureView({
  activeAdventure,
  achievedAdventures,
  contributions,
  templates,
  userPoints,
  totalContribution,
  hasParent,
}: AdventureViewProps) {
  // Calculate contribution to active adventure
  const activeContribution = activeAdventure
    ? contributions
        .filter(c => c.adventure_id === activeAdventure.id)
        .reduce((sum, c) => sum + c.points_contributed, 0)
    : 0

  if (!hasParent) {
    return (
      <div className="mc-panel mc-panel-dark p-6 text-center">
        <Compass className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
        <h2 className="text-lg font-bold mb-2">Ještě nemáš propojeného rodiče</h2>
        <p className="text-[var(--foreground-muted)] mb-4">
          Až tě rodič propojí se svým účtem, budete moci společně plánovat dobrodružství!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--theme-primary)]">
          <Users className="w-4 h-4" />
          <span>Požádej rodiče o propojení</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Adventure */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Compass className="w-5 h-5 text-[var(--theme-primary)]" />
          Aktuální dobrodružství
        </h2>
        <FamilyAdventure
          adventure={activeAdventure}
          userPoints={activeContribution}
          size="lg"
        />
      </div>

      {/* User Stats */}
      <div className="mc-panel mc-panel-dark p-4">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-[var(--theme-accent)]" />
          Tvůj příspěvek rodině
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-black/20 rounded-lg">
            <p className="text-2xl font-bold text-[var(--theme-primary)]">
              {userPoints}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Celkem bodů</p>
          </div>
          <div className="text-center p-3 bg-black/20 rounded-lg">
            <p className="text-2xl font-bold text-[var(--theme-accent)]">
              {achievedAdventures.length}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Dobrodružství splněno</p>
          </div>
        </div>
      </div>

      {/* Achieved Adventures */}
      {achievedAdventures.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--theme-accent)]" />
            Dokončená dobrodružství
          </h2>
          <div className="space-y-3">
            {achievedAdventures.map((adventure, index) => (
              <motion.div
                key={adventure.id}
                className="mc-panel mc-panel-dark p-3 flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                  {ICON_MAP[adventure.icon] || <Star className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{adventure.name}</h3>
                  {adventure.achieved_at && (
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Splněno {new Date(adventure.achieved_at).toLocaleDateString('cs-CZ')}
                    </p>
                  )}
                </div>
                <Sparkles className="w-5 h-5 text-[var(--theme-accent)]" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contributions */}
      {contributions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-[var(--theme-primary)]" />
            Poslední příspěvky
          </h2>
          <div className="space-y-2">
            {contributions.slice(0, 5).map((contribution, index) => (
              <motion.div
                key={contribution.id}
                className="flex items-center justify-between p-2 bg-black/20 rounded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-sm text-[var(--foreground-muted)]">
                  {new Date(contribution.contributed_at).toLocaleDateString('cs-CZ')}
                </span>
                <span className="text-sm text-[var(--theme-primary)] font-bold">
                  +{contribution.points_contributed} bodů
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Adventure Templates - What we could do */}
      {templates.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--theme-accent)]" />
            Na co šetříme?
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] mb-3">
            Podívej, jaké odměny můžete s rodiči odemknout!
          </p>
          <div className="space-y-2">
            {templates
              .sort((a, b) => a.suggested_points - b.suggested_points)
              .map((template) => {
                // Calculate progress if there's an active adventure matching points
                const canAfford = userPoints >= template.suggested_points
                const progress = Math.min(100, (userPoints / template.suggested_points) * 100)

                return (
                  <motion.div
                    key={template.id}
                    className="p-3 rounded-xl border-2 transition-all"
                    style={{
                      backgroundColor: canAfford ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.2)',
                      borderColor: canAfford ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.1)',
                    }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: canAfford ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                          color: canAfford ? '#22c55e' : 'var(--theme-primary)'
                        }}
                      >
                        {ICON_MAP[template.icon] || <Star className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">{template.name}</h3>
                        {template.description && (
                          <p className="text-xs text-[var(--foreground-muted)] truncate">
                            {template.description}
                          </p>
                        )}
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: canAfford ? '#22c55e' : 'var(--theme-primary)',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm" style={{ color: canAfford ? '#22c55e' : 'var(--theme-primary)' }}>
                          {template.suggested_points}
                        </p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">bodů</p>
                        {canAfford && (
                          <span className="text-[10px] text-green-400">✓ Máš!</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
          <p className="text-xs text-center text-[var(--foreground-muted)] mt-3">
            Řekni rodičům, na co se těšíš nejvíc!
          </p>
        </div>
      )}

      {/* Encouragement */}
      <div className="text-center p-4 mc-panel mc-panel-dark">
        <p className="text-sm text-[var(--foreground-muted)]">
          Každá aktivita přispívá k vašemu společnému cíli!
        </p>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Společné zážitky jsou nejlepší odměnou.
        </p>
      </div>
    </div>
  )
}
