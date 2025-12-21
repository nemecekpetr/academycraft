'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateStreakUpdate } from '@/lib/constants'
import { Check, X, Clock, User, Scroll, Star, Loader2 } from 'lucide-react'

interface PendingActivity {
  id: string
  user_id: string
  activity_id: string
  score: number | null
  notes: string | null
  submitted_at: string
  user: {
    username: string
    email: string
    xp: number
    emeralds: number
    current_streak: number
    longest_streak: number
    last_activity_date: string | null
  } | null
  activity: {
    name: string
    icon: string
    xp_reward: number
    emerald_reward: number
    flawless_threshold: number | null
    max_score: number | null
  } | null
}

export default function ApprovalsPage() {
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadPendingActivities()
  }, [])

  async function loadPendingActivities() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('completed_activities')
      .select(`
        id,
        user_id,
        activity_id,
        score,
        notes,
        submitted_at,
        user:profiles(username, email, xp, emeralds, current_streak, longest_streak, last_activity_date),
        activity:activities(name, icon, xp_reward, emerald_reward, flawless_threshold, max_score)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })

    if (!error && data) {
      setPendingActivities(data as unknown as PendingActivity[])
    }

    setLoading(false)
  }

  async function approveActivity(item: PendingActivity) {
    if (!item.activity || !item.user) return

    setProcessingId(item.id)
    const supabase = createClient()

    // Calculate rewards
    let xpEarned = item.activity.xp_reward
    let emeraldsEarned = item.activity.emerald_reward
    let isFlawless = false

    // Check for flawless bonus (2x rewards)
    if (item.activity.flawless_threshold && item.score !== null) {
      if (item.score >= item.activity.flawless_threshold) {
        isFlawless = true
        xpEarned *= 2
        emeraldsEarned *= 2
      }
    }

    // Update the completed activity
    const { error: activityError } = await supabase
      .from('completed_activities')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        xp_earned: xpEarned,
        emeralds_earned: emeraldsEarned,
        is_flawless: isFlawless,
      })
      .eq('id', item.id)

    if (activityError) {
      console.error('Error approving activity:', activityError)
      setProcessingId(null)
      return
    }

    // Calculate streak update
    const streakUpdate = calculateStreakUpdate(
      item.user.last_activity_date,
      item.user.current_streak || 0,
      item.user.longest_streak || 0
    )

    // Update user's XP, emeralds, and streak
    const { error: userError } = await supabase
      .from('profiles')
      .update({
        xp: (item.user.xp || 0) + xpEarned,
        emeralds: (item.user.emeralds || 0) + emeraldsEarned,
        last_activity_date: new Date().toISOString().split('T')[0],
        current_streak: streakUpdate.newStreak,
        longest_streak: streakUpdate.newLongestStreak,
      })
      .eq('id', item.user_id)

    if (userError) {
      console.error('Error updating user:', userError)
    }

    // Remove from list
    setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    setProcessingId(null)
  }

  async function rejectActivity(item: PendingActivity) {
    setProcessingId(item.id)
    const supabase = createClient()

    const { error } = await supabase
      .from('completed_activities')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        xp_earned: 0,
        emeralds_earned: 0,
        is_flawless: false,
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error rejecting activity:', error)
      setProcessingId(null)
      return
    }

    setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Schvalování aktivit</h1>
        <p className="text-[var(--foreground-muted)]">
          Přehled čekajících aktivit ke schválení
        </p>
      </div>

      {pendingActivities.length === 0 ? (
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Žádné čekající aktivity</h2>
          <p className="text-[var(--foreground-muted)]">
            Všechny aktivity byly zpracovány
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingActivities.map((item) => {
            const isFlawless = item.activity?.flawless_threshold &&
              item.score !== null &&
              item.score >= item.activity.flawless_threshold

            return (
              <div
                key={item.id}
                className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User & Activity Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[var(--color-emerald)]/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[var(--color-emerald)]" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.user?.username}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">{item.user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 bg-[var(--color-gold)]/20 rounded-lg flex items-center justify-center">
                        <Scroll className="w-5 h-5 text-[var(--color-gold)]" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.activity?.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {new Date(item.submitted_at).toLocaleString('cs-CZ')}
                        </p>
                      </div>
                    </div>

                    {/* Score & Notes */}
                    {item.score !== null && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[var(--foreground-muted)]">Skóre:</span>
                        <span className={`font-bold ${isFlawless ? 'text-[var(--color-gold)]' : 'text-white'}`}>
                          {item.score}/{item.activity?.max_score || 100}
                        </span>
                        {isFlawless && (
                          <span className="flex items-center gap-1 text-xs bg-[var(--color-gold)]/20 text-[var(--color-gold)] px-2 py-1 rounded">
                            <Star className="w-3 h-3" />
                            FLAWLESS 2x
                          </span>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <div className="mt-2 p-3 bg-[#1a1a2e] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Rewards Preview */}
                  <div className="flex flex-col items-center gap-2 px-6 py-4 bg-[#1a1a2e] rounded-xl">
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Odměna</p>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className={`text-xl font-bold ${isFlawless ? 'text-[var(--color-gold)]' : 'text-[var(--color-xp-green)]'}`}>
                          +{(item.activity?.xp_reward || 0) * (isFlawless ? 2 : 1)}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">XP</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xl font-bold ${isFlawless ? 'text-[var(--color-gold)]' : 'text-[var(--color-emerald)]'}`}>
                          +{(item.activity?.emerald_reward || 0) * (isFlawless ? 2 : 1)}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">Emeraldy</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectActivity(item)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                      Zamítnout
                    </button>
                    <button
                      onClick={() => approveActivity(item)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-2 px-4 py-3 bg-[var(--color-emerald)]/20 text-[var(--color-emerald)] rounded-lg hover:bg-[var(--color-emerald)]/30 transition-colors disabled:opacity-50"
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Schválit
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
