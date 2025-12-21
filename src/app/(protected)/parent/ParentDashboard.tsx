'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { calculateStreakUpdate } from '@/lib/constants'
import {
  Users,
  Check,
  X,
  Clock,
  Star,
  Gift,
  Loader2,
  TrendingUp,
  UserPlus,
  Link,
  Copy
} from 'lucide-react'

interface Child {
  id: string
  username: string
  email: string
  xp: number
  emeralds: number
  current_streak: number
}

interface PendingActivity {
  id: string
  user_id: string
  activity_id: string
  score: number | null
  notes: string | null
  submitted_at: string
  user: { username: string } | null
  activity: {
    name: string
    xp_reward: number
    emerald_reward: number
    flawless_threshold: number | null
    max_score: number | null
  } | null
}

interface PendingPurchase {
  id: string
  user_id: string
  purchased_at: string
  user: { username: string } | null
  item: { name: string; price: number } | null
}

interface ParentDashboardProps {
  profile: {
    id: string
    username: string
  }
  children: Child[]
  pendingActivities: PendingActivity[]
  pendingPurchases: PendingPurchase[]
}

export default function ParentDashboard({
  profile,
  children,
  pendingActivities: initialActivities,
  pendingPurchases: initialPurchases,
}: ParentDashboardProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [pendingActivities, setPendingActivities] = useState(initialActivities)
  const [pendingPurchases, setPendingPurchases] = useState(initialPurchases)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [childEmail, setChildEmail] = useState('')
  const [addingChild, setAddingChild] = useState(false)
  const [addChildError, setAddChildError] = useState<string | null>(null)
  const [addChildSuccess, setAddChildSuccess] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)

  async function addChild() {
    if (!childEmail.trim()) return

    setAddingChild(true)
    setAddChildError(null)
    setAddChildSuccess(null)

    const supabase = createClient()

    // Find the student by email
    const { data: student, error: findError } = await supabase
      .from('profiles')
      .select('id, username, role, parent_id')
      .eq('email', childEmail.trim().toLowerCase())
      .single()

    if (findError || !student) {
      setAddChildError('Student s tímto emailem nebyl nalezen')
      setAddingChild(false)
      return
    }

    if (student.role !== 'student') {
      setAddChildError('Tento uživatel není student')
      setAddingChild(false)
      return
    }

    if (student.parent_id) {
      setAddChildError('Tento student již má přiřazeného rodiče')
      setAddingChild(false)
      return
    }

    // Assign child to parent
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ parent_id: profile.id })
      .eq('id', student.id)

    if (updateError) {
      setAddChildError('Nepodařilo se přiřadit dítě')
      setAddingChild(false)
      return
    }

    setAddChildSuccess(`${student.username} byl úspěšně přidán!`)
    setChildEmail('')
    setAddingChild(false)

    // Refresh the page to show updated children list
    setTimeout(() => {
      router.refresh()
      setShowAddChild(false)
      setAddChildSuccess(null)
    }, 1500)
  }

  async function approveActivity(item: PendingActivity) {
    if (!item.activity) return

    setProcessingId(item.id)
    const supabase = createClient()

    // Get child's current stats
    const { data: childData } = await supabase
      .from('profiles')
      .select('xp, emeralds, current_streak, longest_streak, last_activity_date')
      .eq('id', item.user_id)
      .single()

    if (!childData) {
      setProcessingId(null)
      return
    }

    // Calculate rewards
    let xpEarned = item.activity.xp_reward
    let emeraldsEarned = item.activity.emerald_reward
    let isFlawless = false

    if (item.activity.flawless_threshold && item.score !== null) {
      if (item.score >= item.activity.flawless_threshold) {
        isFlawless = true
        xpEarned *= 2
        emeraldsEarned *= 2
      }
    }

    // Calculate streak update
    const streakUpdate = calculateStreakUpdate(
      childData.last_activity_date,
      childData.current_streak || 0,
      childData.longest_streak || 0
    )

    // Update activity
    await supabase
      .from('completed_activities')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        xp_earned: xpEarned,
        emeralds_earned: emeraldsEarned,
        is_flawless: isFlawless,
      })
      .eq('id', item.id)

    // Update child's XP, emeralds, and streak
    await supabase
      .from('profiles')
      .update({
        xp: (childData.xp || 0) + xpEarned,
        emeralds: (childData.emeralds || 0) + emeraldsEarned,
        last_activity_date: new Date().toISOString().split('T')[0],
        current_streak: streakUpdate.newStreak,
        longest_streak: streakUpdate.newLongestStreak,
      })
      .eq('id', item.user_id)

    setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    setProcessingId(null)
    router.refresh()
  }

  async function rejectActivity(item: PendingActivity) {
    setProcessingId(item.id)
    const supabase = createClient()

    await supabase
      .from('completed_activities')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        xp_earned: 0,
        emeralds_earned: 0,
        is_flawless: false,
      })
      .eq('id', item.id)

    setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    setProcessingId(null)
  }

  async function fulfillPurchase(item: PendingPurchase) {
    setProcessingId(item.id)
    const supabase = createClient()

    await supabase
      .from('purchases')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    setPendingPurchases(prev => prev.filter(p => p.id !== item.id))
    setProcessingId(null)
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          Ahoj, {profile.username}!
        </h1>
        <p style={{ color: theme.colors.textMuted }}>
          Rodičovský přehled
        </p>
      </div>

      {/* Children Overview */}
      <div
        className="rounded-xl p-4 mb-6 border-2"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
            Moje děti ({children.length})
          </h2>
          <button
            onClick={() => setShowAddChild(!showAddChild)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary
            }}
          >
            <UserPlus className="w-4 h-4" />
            Přidat dítě
          </button>
        </div>

        {/* Add Child Form */}
        {showAddChild && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: theme.colors.backgroundLight }}
          >
            <p className="text-sm mb-3" style={{ color: theme.colors.textMuted }}>
              Zadejte email registrovaného studenta pro jeho přidání
            </p>

            {addChildError && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg mb-3 text-sm">
                {addChildError}
              </div>
            )}

            {addChildSuccess && (
              <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded-lg mb-3 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                {addChildSuccess}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                placeholder="email@studenta.cz"
                className="flex-1 px-4 py-2 rounded-lg border-2 bg-transparent focus:outline-none"
                style={{
                  borderColor: theme.colors.backgroundLight,
                  color: theme.colors.text
                }}
              />
              <button
                onClick={addChild}
                disabled={addingChild || !childEmail.trim()}
                className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff'
                }}
              >
                {addingChild ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}

        {children.length === 0 ? (
          <p style={{ color: theme.colors.textMuted }}>
            Zatím nemáte přiřazené žádné děti. Klikněte na "Přidat dítě" pro přidání.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.backgroundLight }}
              >
                <p className="font-bold" style={{ color: theme.colors.text }}>{child.username}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span style={{ color: theme.colors.xp }}>
                    {theme.icons.xp} {child.xp} XP
                  </span>
                  <span style={{ color: theme.colors.currency }}>
                    {theme.icons.currency} {child.emeralds}
                  </span>
                  <span style={{ color: theme.colors.accent }}>
                    🔥 {child.current_streak} dní
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Activities */}
      <div
        className="rounded-xl p-4 mb-6 border-2"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Clock className="w-5 h-5" style={{ color: theme.colors.accent }} />
          Čekající aktivity ({pendingActivities.length})
        </h2>

        {pendingActivities.length === 0 ? (
          <p style={{ color: theme.colors.textMuted }}>
            Žádné aktivity ke schválení
          </p>
        ) : (
          <div className="space-y-3">
            {pendingActivities.map((item) => {
              const isFlawless = item.activity?.flawless_threshold &&
                item.score !== null &&
                item.score >= item.activity.flawless_threshold

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.backgroundLight }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold" style={{ color: theme.colors.primary }}>
                          {item.user?.username}
                        </span>
                        <span style={{ color: theme.colors.textMuted }}>•</span>
                        <span style={{ color: theme.colors.text }}>{item.activity?.name}</span>
                      </div>

                      {item.score !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{ color: theme.colors.textMuted }}>Skóre:</span>
                          <span className="font-bold" style={{ color: isFlawless ? theme.colors.accent : theme.colors.text }}>
                            {item.score}/{item.activity?.max_score || 100}
                          </span>
                          {isFlawless && (
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: `${theme.colors.accent}20`,
                                color: theme.colors.accent
                              }}
                            >
                              <Star className="w-3 h-3" />
                              2x
                            </span>
                          )}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                          "{item.notes}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span style={{ color: theme.colors.xp }}>
                          +{(item.activity?.xp_reward || 0) * (isFlawless ? 2 : 1)} XP
                        </span>
                        <span style={{ color: theme.colors.currency }}>
                          +{(item.activity?.emerald_reward || 0) * (isFlawless ? 2 : 1)} {theme.icons.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectActivity(item)}
                        disabled={processingId === item.id}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                      >
                        {processingId === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => approveActivity(item)}
                        disabled={processingId === item.id}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                          backgroundColor: `${theme.colors.primary}20`,
                          color: theme.colors.primary
                        }}
                      >
                        {processingId === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending Purchases */}
      <div
        className="rounded-xl p-4 border-2"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Gift className="w-5 h-5" style={{ color: theme.colors.currency }} />
          Nákupy k předání ({pendingPurchases.length})
        </h2>

        {pendingPurchases.length === 0 ? (
          <p style={{ color: theme.colors.textMuted }}>
            Žádné nákupy k předání
          </p>
        ) : (
          <div className="space-y-3">
            {pendingPurchases.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: theme.colors.backgroundLight }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: theme.colors.primary }}>
                      {item.user?.username}
                    </span>
                    <span style={{ color: theme.colors.textMuted }}>chce:</span>
                  </div>
                  <p className="font-bold" style={{ color: theme.colors.text }}>
                    {item.item?.name}
                  </p>
                  <p className="text-sm" style={{ color: theme.colors.currency }}>
                    {theme.icons.currency} {item.item?.price}
                  </p>
                </div>

                <button
                  onClick={() => fulfillPurchase(item)}
                  disabled={processingId === item.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.primary
                  }}
                >
                  {processingId === item.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Předáno
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
