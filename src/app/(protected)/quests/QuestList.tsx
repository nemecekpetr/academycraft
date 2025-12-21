'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Scroll,
  Brain,
  GraduationCap,
  BookOpen,
  Bug,
  Star,
  Clock,
  Loader2,
  X,
  Check,
  type LucideProps,
} from 'lucide-react'
import type { Activity, CompletedActivity } from '@/types/database'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  scroll: Scroll,
  brain: Brain,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  bug: Bug,
  star: Star,
}

interface QuestListProps {
  activities: Activity[]
  pendingActivities: (CompletedActivity & { activity: { name: string; icon: string } | null })[]
  userId: string
}

export default function QuestList({ activities, pendingActivities, userId }: QuestListProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!selectedActivity) return

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from('completed_activities').insert({
      user_id: userId,
      activity_id: selectedActivity.id,
      score: selectedActivity.requires_score && score ? parseInt(score) : null,
      notes: notes || null,
      status: 'pending',
      xp_earned: 0,
      emeralds_earned: 0,
      is_flawless: false,
    })

    if (error) {
      console.error('Error submitting activity:', error)
      setLoading(false)
      return
    }

    // Send notification to parent if they have one
    try {
      // Get current user's profile with parent info
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, parent_id')
        .eq('id', userId)
        .single()

      if (profile?.parent_id) {
        // Get parent's email
        const { data: parent } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('id', profile.parent_id)
          .single()

        if (parent?.email) {
          // Send notification email
          await fetch('/api/notifications/approval-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentEmail: parent.email,
              parentName: parent.username,
              childName: profile.username,
              activityName: selectedActivity.name,
              activityIcon: selectedActivity.icon === 'star' ? '⭐' :
                            selectedActivity.icon === 'brain' ? '🧠' :
                            selectedActivity.icon === 'graduation-cap' ? '🎓' :
                            selectedActivity.icon === 'book-open' ? '📖' :
                            selectedActivity.icon === 'bug' ? '🐛' :
                            selectedActivity.icon === 'scroll' ? '📜' : '✅'
            }),
          })
        }
      }
    } catch (notifError) {
      // Don't fail the submission if notification fails
      console.error('Failed to send notification:', notifError)
    }

    setSuccess(true)
    setTimeout(() => {
      setSelectedActivity(null)
      setScore('')
      setNotes('')
      setSuccess(false)
      router.refresh()
    }, 1500)

    setLoading(false)
  }

  return (
    <>
      {/* Pending Activities */}
      {pendingActivities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Clock className="w-5 h-5" style={{ color: theme.colors.accent }} />
            Čeká na schválení ({pendingActivities.length})
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {pendingActivities.map((item) => {
              const Icon = iconMap[item.activity?.icon || 'star'] || Star
              return (
                <div
                  key={item.id}
                  className="text-center p-3 border-2 rounded-xl"
                  style={{
                    backgroundColor: theme.colors.backgroundLight,
                    borderColor: theme.colors.backgroundLight,
                    opacity: 0.7
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-1"
                    style={{ backgroundColor: `${theme.colors.accent}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: theme.colors.accent }} />
                  </div>
                  <h3
                    className="font-bold text-xs mb-1 line-clamp-2 min-h-[2rem]"
                    style={{ color: theme.colors.textMuted }}
                  >
                    {item.activity?.name}
                  </h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded inline-block"
                    style={{
                      backgroundColor: `${theme.colors.accent}20`,
                      color: theme.colors.accent
                    }}
                  >
                    Čeká
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Activities */}
      <h2 className="text-lg font-bold mb-3" style={{ color: theme.colors.text }}>
        {theme.icons.quests} Dostupné questy
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {activities.map((activity) => {
          const Icon = iconMap[activity.icon] || Star

          return (
            <motion.button
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              title={activity.description || undefined}
              className="text-center p-3 border-2 rounded-xl cursor-pointer transition-all"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.backgroundLight
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-1"
                style={{ backgroundColor: `${theme.colors.primary}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: theme.colors.primary }} />
              </div>

              {/* Name */}
              <h3
                className="font-bold text-xs mb-1 line-clamp-2 min-h-[2rem]"
                style={{ color: theme.colors.text }}
              >
                {activity.name}
              </h3>

              {/* Rewards */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="flex items-center gap-0.5" style={{ color: theme.colors.xp }}>
                  {theme.icons.xp} {activity.xp_reward}
                </span>
                <span className="flex items-center gap-0.5" style={{ color: theme.colors.currency }}>
                  {theme.icons.currency} {activity.emerald_reward}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => !loading && setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md p-6 rounded-xl border-2"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.backgroundLight
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {success ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                    Quest odeslán!
                  </h3>
                  <p style={{ color: theme.colors.textMuted }}>
                    Čeká na schválení
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                      {selectedActivity.name}
                    </h3>
                    <button
                      onClick={() => setSelectedActivity(null)}
                      style={{ color: theme.colors.textMuted }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Description */}
                  {selectedActivity.description && (
                    <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                      {selectedActivity.description}
                    </p>
                  )}

                  {/* Rewards */}
                  <div
                    className="flex items-center gap-4 mb-6 p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.backgroundLight }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{theme.icons.xp}</span>
                      <span className="font-bold" style={{ color: theme.colors.xp }}>
                        +{selectedActivity.xp_reward} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg">{theme.icons.currency}</span>
                      <span className="font-bold" style={{ color: theme.colors.currency }}>
                        +{selectedActivity.emerald_reward}
                      </span>
                    </div>
                    {selectedActivity.flawless_threshold && (
                      <div className="text-xs" style={{ color: theme.colors.accent }}>
                        ✨ {selectedActivity.flawless_threshold}+ = 2x
                      </div>
                    )}
                  </div>

                  {selectedActivity.requires_score && (
                    <div className="mb-4">
                      <label className="block mb-2 text-sm" style={{ color: theme.colors.text }}>
                        Skóre (0-{selectedActivity.max_score}) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedActivity.max_score || 100}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors"
                        style={{
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.backgroundLight,
                          color: theme.colors.text
                        }}
                        placeholder="Zadej své skóre"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block mb-2 text-sm" style={{ color: theme.colors.text }}>
                      Poznámka (volitelné)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-24 px-4 py-3 rounded-lg border-2 outline-none resize-none transition-colors"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.backgroundLight,
                        color: theme.colors.text
                      }}
                      placeholder={
                        selectedActivity.icon === 'bug'
                          ? 'Vysvětli, proč jsi udělal/a chybu...'
                          : 'Nějaké poznámky k aktivitě...'
                      }
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || (selectedActivity.requires_score && !score)}
                    className="w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Odesílám...
                      </>
                    ) : (
                      'Odeslat ke schválení'
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
