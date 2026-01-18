'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Compass, Trophy, Users, Sparkles, MapPin, Star, ChefHat, Film, Trees, Heart,
  Gift, Clock, Check, X, Loader2, ShoppingBag
} from 'lucide-react'
import type { FamilyAdventure as FamilyAdventureType, AdventureContribution, AdventureTemplate, RewardRequest } from '@/types/database'

interface AdventureViewProps {
  activeAdventure: FamilyAdventureType | null
  achievedAdventures: FamilyAdventureType[]
  contributions: (AdventureContribution & { adventure?: FamilyAdventureType })[]
  templates: AdventureTemplate[]
  userPoints: number
  totalContribution: number
  hasParent: boolean
  rewardRequests: RewardRequest[]
  userId: string
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
  achievedAdventures,
  templates,
  userPoints,
  hasParent,
  rewardRequests,
  userId,
}: AdventureViewProps) {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<AdventureTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Separate requests by status
  const pendingRequests = rewardRequests.filter(r => r.status === 'pending')
  const approvedRequests = rewardRequests.filter(r => r.status === 'approved')
  const fulfilledRequests = rewardRequests.filter(r => r.status === 'fulfilled')

  async function handleSelectReward() {
    if (!selectedTemplate) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: rpcError } = await supabase.rpc('request_reward', {
      p_user_id: userId,
      p_template_id: selectedTemplate.id,
    })

    if (rpcError) {
      console.error('Error requesting reward:', rpcError)
      setError(rpcError.message || 'Chyba při výběru odměny')
      setLoading(false)
      return
    }

    setSelectedTemplate(null)
    setLoading(false)
    router.refresh()
  }

  if (!hasParent) {
    return (
      <div className="mc-panel mc-panel-dark p-6 text-center">
        <Compass className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
        <h2 className="text-lg font-bold mb-2">Ještě nemáš propojeného rodiče</h2>
        <p className="text-[var(--foreground-muted)] mb-4">
          Až tě rodič propojí se svým účtem, budeš moci vybírat odměny!
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
      {/* User Points */}
      <div className="mc-panel mc-panel-dark p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--theme-primary)]/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-[var(--theme-primary)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--foreground-muted)]">Tvoje body</p>
              <p className="text-2xl font-bold text-[var(--theme-primary)]">{userPoints}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--foreground-muted)]">Odměn splněno</p>
            <p className="text-lg font-bold text-[var(--theme-accent)]">{fulfilledRequests.length}</p>
          </div>
        </div>
      </div>

      {/* Pending Requests - waiting for parent approval */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Čeká na schválení
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{request.reward_name}</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Čeká na schválení rodičem
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-500">{request.points_spent}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">bodů</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Requests - waiting to be fulfilled */}
      {approvedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Schváleno - čeká na splnění
          </h2>
          <div className="space-y-2">
            {approvedRequests.map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-xl border-2 border-green-500/30 bg-green-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{request.reward_name}</h3>
                    <p className="text-xs text-green-400">
                      Rodič schválil! Brzy se dočkáš.
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Rewards */}
      <div>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[var(--theme-accent)]" />
          Vyber si odměnu
        </h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-3">
          Klikni na odměnu, kterou chceš získat
        </p>
        <div className="space-y-2">
          {templates
            .sort((a, b) => a.suggested_points - b.suggested_points)
            .map((template) => {
              const canAfford = userPoints >= template.suggested_points
              const progress = Math.min(100, (userPoints / template.suggested_points) * 100)

              return (
                <motion.button
                  key={template.id}
                  onClick={() => canAfford && setSelectedTemplate(template)}
                  disabled={!canAfford}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    canAfford
                      ? 'cursor-pointer hover:scale-[1.01] border-green-500/30 bg-green-500/10'
                      : 'cursor-not-allowed opacity-60 border-white/10 bg-black/20'
                  }`}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: canAfford ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: canAfford ? '#22c55e' : 'var(--foreground-muted)'
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
                      <p className="font-bold text-sm" style={{ color: canAfford ? '#22c55e' : 'var(--foreground-muted)' }}>
                        {template.suggested_points}
                      </p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">bodů</p>
                      {canAfford && (
                        <span className="text-[10px] text-green-400 font-bold">VYBRAT</span>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
        </div>
      </div>

      {/* Fulfilled Rewards (History) */}
      {fulfilledRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--theme-accent)]" />
            Získané odměny
          </h2>
          <div className="space-y-2">
            {fulfilledRequests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-xl bg-black/20 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{request.reward_name}</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {request.fulfilled_at && new Date(request.fulfilled_at).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-[var(--theme-accent)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achieved Adventures (Legacy) */}
      {achievedAdventures.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--theme-primary)]" />
            Splněná dobrodružství
          </h2>
          <div className="space-y-2">
            {achievedAdventures.map((adventure) => (
              <div
                key={adventure.id}
                className="p-3 rounded-xl bg-black/20 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center text-[var(--theme-primary)]">
                    {ICON_MAP[adventure.icon] || <Star className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{adventure.name}</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {adventure.achieved_at && new Date(adventure.achieved_at).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => !loading && setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm p-6 rounded-xl mc-panel mc-panel-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-[var(--theme-primary)]/20 flex items-center justify-center mx-auto mb-4 text-[var(--theme-primary)]">
                  {ICON_MAP[selectedTemplate.icon] || <Gift className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold mb-2">{selectedTemplate.name}</h3>
                {selectedTemplate.description && (
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    {selectedTemplate.description}
                  </p>
                )}

                <div className="flex items-center justify-center gap-2 text-lg mb-4">
                  <Heart className="w-5 h-5 text-[var(--theme-primary)]" />
                  <span className="font-bold text-[var(--theme-primary)]">
                    {selectedTemplate.suggested_points} bodů
                  </span>
                </div>

                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                  Po výběru bude odměna odeslána rodičům ke schválení.
                </p>

                {error && (
                  <div className="bg-red-900/50 border border-red-500 p-3 text-red-200 text-sm mb-4 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-lg font-bold bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSelectReward}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-lg font-bold text-black bg-[var(--theme-primary)] hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Vybrat
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
