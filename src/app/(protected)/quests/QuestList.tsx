'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import SessionReflection from '@/components/game/SessionReflection'
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
  Sparkles,
  Calendar,
  type LucideProps,
} from 'lucide-react'
import type { Activity, CompletedActivity, SkillArea } from '@/types/database'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  scroll: Scroll,
  brain: Brain,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  bug: Bug,
  star: Star,
}

// Check if string is an emoji (for DB-stored emoji icons)
function isEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(str)
}

// Default fallback messages for purpose (in case activity doesn't have one)
const defaultPurposeMap: Record<string, string> = {
  scroll: 'Každý test ti ukáže, co už umíš a kam směřovat dál. Chyby jsou součást učení!',
  brain: 'Logické myšlení ti pomůže řešit problémy nejen ve škole, ale i v životě!',
  'graduation-cap': 'Ptát se je super! Nejlepší studenti se nebojí požádat o pomoc.',
  'book-open': '20 minut denně dělá velký rozdíl! Mozek se učí postupně.',
  bug: 'Chyby jsou učitelé! Když pochopíš, proč se stala, příště to zvládneš.',
  star: 'Každý krok vpřed se počítá!',
}

// Extended Activity type with skill area
interface ActivityWithSkillArea extends Activity {
  skill_area?: SkillArea | null
}

interface QuestListProps {
  activities: ActivityWithSkillArea[]
  pendingActivities: (CompletedActivity & { activity: { name: string; icon: string } | null })[]
  userId: string
}

// Icon component that handles both Lucide icons and emoji
function ActivityIcon({ icon, size = 'md', color }: { icon: string; size?: 'sm' | 'md' | 'lg'; color: string }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  const emojiSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  if (isEmoji(icon)) {
    return <span className={emojiSizes[size]}>{icon}</span>
  }

  const Icon = iconMap[icon] || Star
  return <Icon className={sizeClasses[size]} style={{ color }} />
}

export default function QuestList({ activities, pendingActivities, userId }: QuestListProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithSkillArea | null>(null)
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [activityDate, setActivityDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [completedActivityName, setCompletedActivityName] = useState('')

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
      activity_date: activityDate,
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
              activityIcon: isEmoji(selectedActivity.icon) ? selectedActivity.icon : '✅'
            }),
          })
        }
      }
    } catch (notifError) {
      // Don't fail the submission if notification fails
      console.error('Failed to send notification:', notifError)
    }

    setSuccess(true)
    setCompletedActivityName(selectedActivity.name)

    setTimeout(() => {
      setSelectedActivity(null)
      setScore('')
      setNotes('')
      setActivityDate(new Date().toISOString().split('T')[0])
      setSuccess(false)
      // Show reflection modal after success (Motivation 3.0 - Flow tracking)
      setShowReflection(true)
    }, 1500)

    setLoading(false)
  }

  const handleReflectionClose = () => {
    setShowReflection(false)
    setCompletedActivityName('')
    router.refresh()
  }

  // Format relative time for pending activities
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Právě teď'
    if (diffMins < 60) return `Před ${diffMins} min`
    if (diffHours < 24) return `Před ${diffHours} h`
    if (diffDays === 1) return 'Včera'
    return `Před ${diffDays} dny`
  }

  return (
    <>
      {/* Session Reflection Modal (Motivation 3.0 - Flow tracking) */}
      <SessionReflection
        isOpen={showReflection}
        onClose={handleReflectionClose}
        activityName={completedActivityName}
      />

      {/* Pending Activities - Improved UX */}
      {pendingActivities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Clock className="w-5 h-5" style={{ color: theme.colors.accent }} />
            Čeká na schválení ({pendingActivities.length})
          </h2>
          <div className="space-y-2">
            {pendingActivities.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border-2"
                style={{
                  backgroundColor: theme.colors.backgroundLight,
                  borderColor: `${theme.colors.accent}30`,
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.accent}20` }}
                >
                  <ActivityIcon
                    icon={item.activity?.icon || 'star'}
                    size="md"
                    color={theme.colors.accent}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" style={{ color: theme.colors.text }}>
                    {item.activity?.name || 'Aktivita'}
                  </h3>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {formatRelativeTime(item.submitted_at)} · Čeká na rodiče
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex-shrink-0">
                  <motion.div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accent }}
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Activities - Single column on mobile */}
      <h2 className="text-lg font-bold mb-3" style={{ color: theme.colors.text }}>
        {theme.icons.quests} Dostupné questy
      </h2>
      <div className="space-y-3">
        {activities.map((activity) => {
          return (
            <motion.button
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="w-full text-left p-4 border-2 rounded-xl cursor-pointer transition-all"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.backgroundLight
              }}
              whileHover={{ scale: 1.01, borderColor: theme.colors.primary }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                {/* Icon - Larger */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <ActivityIcon
                    icon={activity.icon}
                    size="lg"
                    color={theme.colors.primary}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name - No truncation */}
                  <h3
                    className="font-bold text-base mb-1"
                    style={{ color: theme.colors.text }}
                  >
                    {activity.name}
                  </h3>

                  {/* Skill Area Badge */}
                  {activity.skill_area && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full inline-block"
                      style={{
                        backgroundColor: `${activity.skill_area.color}20`,
                        color: activity.skill_area.color
                      }}
                    >
                      {activity.skill_area.name}
                    </span>
                  )}
                </div>

                {/* Points - Prominent display */}
                <div
                  className="flex-shrink-0 text-center px-3 py-2 rounded-xl"
                  style={{ backgroundColor: `${theme.colors.primary}15` }}
                >
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    <span
                      className="font-bold text-lg"
                      style={{ color: theme.colors.primary }}
                    >
                      +{activity.adventure_points}
                    </span>
                  </div>
                  <span
                    className="text-[10px] block"
                    style={{ color: theme.colors.textMuted }}
                  >
                    bodů
                  </span>
                </div>
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
                    Skvělá práce!
                  </h3>
                  <p style={{ color: theme.colors.textMuted }}>
                    Tvoje snaha se počítá. Čeká na potvrzení.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header with close button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${theme.colors.primary}15` }}
                      >
                        <ActivityIcon
                          icon={selectedActivity.icon}
                          size="md"
                          color={theme.colors.primary}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                          {selectedActivity.name}
                        </h3>
                        {selectedActivity.skill_area && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full inline-block"
                            style={{
                              backgroundColor: `${selectedActivity.skill_area.color}20`,
                              color: selectedActivity.skill_area.color
                            }}
                          >
                            {selectedActivity.skill_area.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedActivity(null)}
                      className="p-1"
                      style={{ color: theme.colors.textMuted }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Reward preview */}
                  <div
                    className="flex items-center justify-center gap-2 mb-4 p-3 rounded-xl"
                    style={{ backgroundColor: `${theme.colors.primary}10` }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: theme.colors.primary }} />
                    <span className="font-bold text-lg" style={{ color: theme.colors.primary }}>
                      +{selectedActivity.adventure_points} bodů pro rodinu
                    </span>
                  </div>

                  {/* Description */}
                  {selectedActivity.description && (
                    <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                      {selectedActivity.description}
                    </p>
                  )}

                  {/* Why Learning This? - Growth Mindset (Motivation 3.0) */}
                  <div
                    className="mb-5 p-3 rounded-lg border-l-4"
                    style={{
                      backgroundColor: `${theme.colors.primary}08`,
                      borderLeftColor: selectedActivity.skill_area?.color || theme.colors.primary
                    }}
                  >
                    <p className="text-xs font-bold mb-1" style={{ color: theme.colors.primary }}>
                      💡 Proč se to učím?
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.text }}>
                      {selectedActivity.purpose_message || defaultPurposeMap[selectedActivity.icon] || 'Každý krok vpřed se počítá!'}
                    </p>
                  </div>

                  {selectedActivity.requires_score && (
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium" style={{ color: theme.colors.text }}>
                        Skóre (0-{selectedActivity.max_score}) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={selectedActivity.max_score || 100}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors text-lg"
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

                  {/* Date picker for when activity was completed */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: theme.colors.text }}>
                      <Calendar className="w-4 h-4" style={{ color: theme.colors.primary }} />
                      Kdy jsi to udělal/a?
                    </label>
                    <input
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-colors"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.backgroundLight,
                        color: theme.colors.text
                      }}
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block mb-2 text-sm font-medium" style={{ color: theme.colors.text }}>
                      Poznámka (volitelné)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-20 px-4 py-3 rounded-lg border-2 outline-none resize-none transition-colors"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.backgroundLight,
                        color: theme.colors.text
                      }}
                      placeholder="Nějaké poznámky k aktivitě..."
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || (selectedActivity.requires_score && !score)}
                    className="w-full py-4 px-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Odesílám...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Hotovo!
                      </>
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
