'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, User, Scroll, Heart, Loader2, MessageCircle, Send } from 'lucide-react'

interface SkillArea {
  name: string
  color: string
}

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
    adventure_points: number
  } | null
  activity: {
    name: string
    icon: string
    adventure_points: number
    max_score: number | null
    purpose_message: string | null
    skill_area: SkillArea | null
  } | null
}

export default function ApprovalsPage() {
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recognitionMessages, setRecognitionMessages] = useState<Record<string, string>>({})
  const [showRecognitionInput, setShowRecognitionInput] = useState<string | null>(null)

  useEffect(() => {
    loadPendingActivities()
  }, [])

  async function loadPendingActivities() {
    try {
      const response = await fetch('/api/admin/approvals')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load activities')
        setLoading(false)
        return
      }

      setPendingActivities(result.data as PendingActivity[])
    } catch (err) {
      console.error('Error loading activities:', err)
      setError('Nepodařilo se načíst aktivity')
    }
    setLoading(false)
  }

  async function approveActivity(item: PendingActivity, withRecognition: boolean = false) {
    if (!item.activity || !item.user) return

    setProcessingId(item.id)
    setError(null)

    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: item.id,
          action: 'approve',
          recognitionMessage: withRecognition ? recognitionMessages[item.id] : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se schválit aktivitu')
        setProcessingId(null)
        return
      }

      // Remove from list
      setPendingActivities(prev => prev.filter(a => a.id !== item.id))
      setShowRecognitionInput(null)
      setRecognitionMessages(prev => {
        const updated = { ...prev }
        delete updated[item.id]
        return updated
      })
    } catch (err) {
      console.error('Error approving activity:', err)
      setError('Nepodařilo se schválit aktivitu')
    }

    setProcessingId(null)
  }

  async function rejectActivity(item: PendingActivity) {
    setProcessingId(item.id)
    setError(null)

    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: item.id, action: 'reject' }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se zamítnout aktivitu')
        setProcessingId(null)
        return
      }

      // Remove from list
      setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    } catch (err) {
      console.error('Error rejecting activity:', err)
      setError('Nepodařilo se zamítnout aktivitu')
    }

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
          Přehled čekajících aktivit ke schválení (Motivace 3.0)
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

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
            const activity = Array.isArray(item.activity) ? item.activity[0] : item.activity
            const user = Array.isArray(item.user) ? item.user[0] : item.user
            const skillArea = activity?.skill_area
              ? (Array.isArray(activity.skill_area) ? activity.skill_area[0] : activity.skill_area)
              : null

            return (
              <div
                key={item.id}
                className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* User & Activity Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[var(--color-emerald)]/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[var(--color-emerald)]" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{user?.username}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">{user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 bg-[var(--color-gold)]/20 rounded-lg flex items-center justify-center">
                        <Scroll className="w-5 h-5 text-[var(--color-gold)]" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{activity?.name}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {new Date(item.submitted_at).toLocaleString('cs-CZ')}
                        </p>
                        {skillArea && (
                          <span
                            className="inline-block mt-1 text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${skillArea.color}20`,
                              color: skillArea.color
                            }}
                          >
                            {skillArea.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Purpose message */}
                    {activity?.purpose_message && (
                      <div className="mt-3 p-3 bg-[var(--color-emerald)]/10 rounded-lg border border-[var(--color-emerald)]/20">
                        <p className="text-sm text-[var(--color-emerald)] italic">
                          „{activity.purpose_message}"
                        </p>
                      </div>
                    )}

                    {/* Score */}
                    {item.score !== null && activity?.max_score && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[var(--foreground-muted)]">Skóre:</span>
                        <span className="font-bold text-white">
                          {item.score}/{activity.max_score}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-2 p-3 bg-[#1a1a2e] rounded-lg">
                        <p className="text-sm text-[var(--foreground-muted)]">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Rewards Preview */}
                  <div className="flex flex-col items-center gap-2 px-6 py-4 bg-[#1a1a2e] rounded-xl min-w-[140px]">
                    <p className="text-xs text-[var(--foreground-muted)] mb-2">Rodinné body</p>
                    <div className="flex items-center gap-2">
                      <Heart className="w-6 h-6 text-pink-500" />
                      <span className="text-2xl font-bold text-pink-500">
                        +{activity?.adventure_points || 10}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] text-center mt-2">
                      Přispěje k rodinnému<br />dobrodružství
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
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
                    <button
                      onClick={() => setShowRecognitionInput(showRecognitionInput === item.id ? null : item.id)}
                      disabled={processingId === item.id}
                      className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                    >
                      <MessageCircle className="w-5 h-5" />
                      S uznáním
                    </button>
                  </div>
                </div>

                {/* Recognition Input */}
                {showRecognitionInput === item.id && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a4e]">
                    <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                      Zpráva uznání (Now-That Recognition)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={recognitionMessages[item.id] || ''}
                        onChange={(e) => setRecognitionMessages(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Např. Skvělá práce! Vidím, jak moc ses snažil/a."
                        className="flex-1 px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={() => approveActivity(item, true)}
                        disabled={processingId === item.id || !recognitionMessages[item.id]?.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        {processingId === item.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        Schválit s uznáním
                      </button>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-2">
                      Tato zpráva se studentovi zobrazí jako nečekané uznání - motivuje víc než předvídatelná odměna.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
