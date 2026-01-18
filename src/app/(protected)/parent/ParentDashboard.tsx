'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import FamilyAdventure from '@/components/game/FamilyAdventure'
import type { FamilyAdventure as FamilyAdventureType, AdventureTemplate } from '@/types/database'
import {
  Users,
  Check,
  X,
  Clock,
  Star,
  Gift,
  Loader2,
  UserPlus,
  Compass,
  Plus,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Calendar,
  Target,
  Minus
} from 'lucide-react'

interface Child {
  id: string
  username: string
  email: string
  xp: number
  emeralds: number
  adventure_points: number
  current_streak: number
  weekly_goal_days: number
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
    adventure_points: number
    flawless_threshold: number | null
    max_score: number | null
    purpose_message: string | null
    skill_area: { name: string; color: string } | null
  } | null
}

interface PendingPurchase {
  id: string
  user_id: string
  purchased_at: string
  user: { username: string } | null
  item: { name: string; price: number } | null
}

interface RewardRequest {
  id: string
  user_id: string
  reward_name: string
  reward_description: string | null
  points_spent: number
  status: string
  created_at: string
  reviewed_at: string | null
  user: { username: string } | null
}

interface ParentDashboardProps {
  profile: {
    id: string
    username: string
  }
  children: Child[]
  pendingActivities: PendingActivity[]
  pendingPurchases: PendingPurchase[]
  familyAdventures: FamilyAdventureType[]
  adventureTemplates: AdventureTemplate[]
  pendingRewardRequests: RewardRequest[]
  approvedRewardRequests: RewardRequest[]
  parentId: string
}

export default function ParentDashboard({
  profile,
  children,
  pendingActivities: initialActivities,
  pendingPurchases: initialPurchases,
  familyAdventures: initialAdventures,
  adventureTemplates,
  pendingRewardRequests: initialPendingRewards,
  approvedRewardRequests: initialApprovedRewards,
  parentId,
}: ParentDashboardProps) {
  const { theme } = useTheme()
  const router = useRouter()
  const [pendingActivities, setPendingActivities] = useState(initialActivities)
  const [pendingPurchases, setPendingPurchases] = useState(initialPurchases)
  const [familyAdventures, setFamilyAdventures] = useState(initialAdventures)
  const [pendingRewardRequests, setPendingRewardRequests] = useState(initialPendingRewards)
  const [approvedRewardRequests, setApprovedRewardRequests] = useState(initialApprovedRewards)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [processingRewardId, setProcessingRewardId] = useState<string | null>(null)
  const [childEmail, setChildEmail] = useState('')
  const [addingChild, setAddingChild] = useState(false)
  const [addChildError, setAddChildError] = useState<string | null>(null)
  const [addChildSuccess, setAddChildSuccess] = useState<string | null>(null)
  const [showAddChild, setShowAddChild] = useState(false)

  // Recognition state
  const [showRecognition, setShowRecognition] = useState(false)
  const [recognitionChild, setRecognitionChild] = useState<Child | null>(null)
  const [recognitionMessage, setRecognitionMessage] = useState('')
  const [recognitionType, setRecognitionType] = useState<'parent_note' | 'surprise_celebration'>('parent_note')
  const [sendingRecognition, setSendingRecognition] = useState(false)

  // Adventure state
  const [showCreateAdventure, setShowCreateAdventure] = useState(false)
  const [newAdventureName, setNewAdventureName] = useState('')
  const [newAdventureDesc, setNewAdventureDesc] = useState('')
  const [newAdventurePoints, setNewAdventurePoints] = useState(100)
  const [creatingAdventure, setCreatingAdventure] = useState(false)

  // Approval message state - per activity to avoid cross-contamination
  const [approvalMessages, setApprovalMessages] = useState<Record<string, string>>({})

  // Goal setting state (Motivation 3.0 - Autonomy: Set goals together)
  const [editingGoalChildId, setEditingGoalChildId] = useState<string | null>(null)
  const [childrenState, setChildrenState] = useState(children)

  const activeAdventure = familyAdventures.find(a => a.status === 'active')

  async function updateWeeklyGoal(childId: string, newGoal: number) {
    const supabase = createClient()
    const clampedGoal = Math.max(1, Math.min(7, newGoal))

    const { error } = await supabase
      .from('profiles')
      .update({ weekly_goal_days: clampedGoal })
      .eq('id', childId)

    if (!error) {
      setChildrenState(prev =>
        prev.map(c => c.id === childId ? { ...c, weekly_goal_days: clampedGoal } : c)
      )
    }
  }

  async function addChild() {
    if (!childEmail.trim()) return

    setAddingChild(true)
    setAddChildError(null)
    setAddChildSuccess(null)

    const supabase = createClient()

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

    setTimeout(() => {
      router.refresh()
      setShowAddChild(false)
      setAddChildSuccess(null)
    }, 1500)
  }

  async function approveActivity(item: PendingActivity) {
    if (!item.activity) return

    setProcessingId(item.id)

    try {
      const message = approvalMessages[item.id]?.trim() || ''

      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: item.id,
          action: 'approve',
          recognitionMessage: message || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Approval failed:', data.error)
        // Could show error to user here
        setProcessingId(null)
        return
      }

      // Clear message for this activity
      setApprovalMessages(prev => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      setPendingActivities(prev => prev.filter(a => a.id !== item.id))
      router.refresh()
    } catch (error) {
      console.error('Approval error:', error)
    } finally {
      setProcessingId(null)
    }
  }

  async function rejectActivity(item: PendingActivity) {
    setProcessingId(item.id)

    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: item.id,
          action: 'reject',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Rejection failed:', data.error)
        setProcessingId(null)
        return
      }

      setPendingActivities(prev => prev.filter(a => a.id !== item.id))
    } catch (error) {
      console.error('Rejection error:', error)
    } finally {
      setProcessingId(null)
    }
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

  async function sendRecognition() {
    if (!recognitionChild || !recognitionMessage.trim()) return

    setSendingRecognition(true)
    const supabase = createClient()

    await supabase
      .from('recognitions')
      .insert({
        user_id: recognitionChild.id,
        recognition_type: recognitionType,
        title: recognitionType === 'surprise_celebration' ? 'Překvapivá oslava!' : 'Zpráva od rodiče',
        message: recognitionMessage,
        created_by: profile.id,
      })

    setSendingRecognition(false)
    setShowRecognition(false)
    setRecognitionChild(null)
    setRecognitionMessage('')
  }

  async function createAdventure() {
    if (!newAdventureName.trim()) return

    setCreatingAdventure(true)
    const supabase = createClient()

    const { data: newAdventure } = await supabase
      .from('family_adventures')
      .insert({
        family_id: profile.id,
        name: newAdventureName,
        description: newAdventureDesc || null,
        points_needed: newAdventurePoints,
        points_current: 0,
        icon: 'compass',
        status: 'active',
        created_by: profile.id,
      })
      .select()
      .single()

    if (newAdventure) {
      setFamilyAdventures([newAdventure, ...familyAdventures])
    }

    setCreatingAdventure(false)
    setShowCreateAdventure(false)
    setNewAdventureName('')
    setNewAdventureDesc('')
    setNewAdventurePoints(100)
    router.refresh()
  }

  async function reviewRewardRequest(requestId: string, approved: boolean) {
    setProcessingRewardId(requestId)
    const supabase = createClient()

    const { error } = await supabase.rpc('review_reward_request', {
      p_request_id: requestId,
      p_reviewer_id: parentId,
      p_approved: approved,
    })

    if (error) {
      console.error('Error reviewing reward request:', error)
      setProcessingRewardId(null)
      return
    }

    if (approved) {
      // Move from pending to approved
      const request = pendingRewardRequests.find(r => r.id === requestId)
      if (request) {
        setPendingRewardRequests(prev => prev.filter(r => r.id !== requestId))
        setApprovedRewardRequests(prev => [{ ...request, status: 'approved', reviewed_at: new Date().toISOString() }, ...prev])
      }
    } else {
      // Just remove from pending
      setPendingRewardRequests(prev => prev.filter(r => r.id !== requestId))
    }

    setProcessingRewardId(null)
    router.refresh()
  }

  async function fulfillRewardRequest(requestId: string) {
    setProcessingRewardId(requestId)
    const supabase = createClient()

    const { error } = await supabase.rpc('fulfill_reward_request', {
      p_request_id: requestId,
      p_reviewer_id: parentId,
    })

    if (error) {
      console.error('Error fulfilling reward request:', error)
      setProcessingRewardId(null)
      return
    }

    setApprovedRewardRequests(prev => prev.filter(r => r.id !== requestId))
    setProcessingRewardId(null)
    router.refresh()
  }

  return (
    <main className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
          Ahoj, {profile.username}!
        </h1>
        <p style={{ color: theme.colors.textMuted }}>
          Rodičovský přehled (Motivace 3.0)
        </p>
      </div>

      {/* Family Adventure Section */}
      <div
        className="rounded-xl p-4 mb-6 border-2"
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Compass className="w-5 h-5" style={{ color: theme.colors.primary }} />
            Rodinné dobrodružství
          </h2>
          {!activeAdventure && (
            <button
              onClick={() => setShowCreateAdventure(!showCreateAdventure)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                color: theme.colors.primary
              }}
            >
              <Plus className="w-4 h-4" />
              Nové dobrodružství
            </button>
          )}
        </div>

        {/* Create Adventure Form */}
        {showCreateAdventure && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: theme.colors.backgroundLight }}
          >
            <p className="text-sm mb-3" style={{ color: theme.colors.textMuted }}>
              Vytvořte společný cíl pro rodinu
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={newAdventureName}
                onChange={(e) => setNewAdventureName(e.target.value)}
                placeholder="Název dobrodružství (např. Filmový večer)"
                className="w-full px-4 py-2 rounded-lg border-2 bg-transparent focus:outline-none"
                style={{
                  borderColor: theme.colors.backgroundLight,
                  color: theme.colors.text
                }}
              />

              <textarea
                value={newAdventureDesc}
                onChange={(e) => setNewAdventureDesc(e.target.value)}
                placeholder="Popis (volitelné)"
                rows={2}
                className="w-full px-4 py-2 rounded-lg border-2 bg-transparent focus:outline-none resize-none"
                style={{
                  borderColor: theme.colors.backgroundLight,
                  color: theme.colors.text
                }}
              />

              <div>
                <label className="text-sm block mb-1" style={{ color: theme.colors.textMuted }}>
                  Potřebné body: {newAdventurePoints}
                </label>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={newAdventurePoints}
                  onChange={(e) => setNewAdventurePoints(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Template suggestions */}
              {adventureTemplates.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: theme.colors.textMuted }}>
                    Inspirace:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {adventureTemplates.slice(0, 4).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setNewAdventureName(template.name)
                          setNewAdventureDesc(template.description || '')
                          setNewAdventurePoints(template.suggested_points)
                        }}
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          borderColor: theme.colors.backgroundLight,
                          color: theme.colors.textMuted
                        }}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={createAdventure}
                disabled={creatingAdventure || !newAdventureName.trim()}
                className="w-full px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff'
                }}
              >
                {creatingAdventure ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Vytvořit dobrodružství'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Current Adventure */}
        <FamilyAdventure
          adventure={activeAdventure || null}
          size="lg"
        />
      </div>

      {/* Children Overview with Recognition */}
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

        {/* Recognition Form */}
        {showRecognition && recognitionChild && (
          <div
            className="p-4 rounded-lg mb-4"
            style={{ backgroundColor: theme.colors.backgroundLight }}
          >
            <p className="text-sm mb-3 font-bold" style={{ color: theme.colors.text }}>
              Poslat uznání pro {recognitionChild.username}
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setRecognitionType('parent_note')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 border-2`}
                style={{
                  borderColor: recognitionType === 'parent_note' ? theme.colors.primary : 'transparent',
                  backgroundColor: recognitionType === 'parent_note' ? `${theme.colors.primary}20` : 'transparent',
                  color: recognitionType === 'parent_note' ? theme.colors.primary : theme.colors.textMuted
                }}
              >
                <Heart className="w-4 h-4" />
                Zpráva
              </button>
              <button
                onClick={() => setRecognitionType('surprise_celebration')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 border-2`}
                style={{
                  borderColor: recognitionType === 'surprise_celebration' ? theme.colors.accent : 'transparent',
                  backgroundColor: recognitionType === 'surprise_celebration' ? `${theme.colors.accent}20` : 'transparent',
                  color: recognitionType === 'surprise_celebration' ? theme.colors.accent : theme.colors.textMuted
                }}
              >
                <Sparkles className="w-4 h-4" />
                Oslava
              </button>
            </div>

            <textarea
              value={recognitionMessage}
              onChange={(e) => setRecognitionMessage(e.target.value)}
              placeholder={recognitionType === 'surprise_celebration'
                ? 'Jsem na tebe pyšný/á za...'
                : 'Tvoje snaha mě těší...'}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border-2 bg-transparent focus:outline-none resize-none mb-3"
              style={{
                borderColor: theme.colors.backgroundLight,
                color: theme.colors.text
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRecognition(false)
                  setRecognitionChild(null)
                  setRecognitionMessage('')
                }}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: theme.colors.backgroundLight,
                  color: theme.colors.textMuted
                }}
              >
                Zrušit
              </button>
              <button
                onClick={sendRecognition}
                disabled={sendingRecognition || !recognitionMessage.trim()}
                className="flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#fff'
                }}
              >
                {sendingRecognition ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Odeslat
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {childrenState.length === 0 ? (
          <p style={{ color: theme.colors.textMuted }}>
            Zatím nemáte přiřazené žádné děti. Klikněte na "Přidat dítě" pro přidání.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {childrenState.map((child) => (
              <div
                key={child.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.backgroundLight }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold" style={{ color: theme.colors.text }}>{child.username}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingGoalChildId(
                        editingGoalChildId === child.id ? null : child.id
                      )}
                      className="p-1.5 rounded-lg"
                      style={{
                        backgroundColor: editingGoalChildId === child.id
                          ? `${theme.colors.primary}30`
                          : `${theme.colors.primary}20`,
                        color: theme.colors.primary
                      }}
                      title="Nastavit týdenní cíl"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRecognitionChild(child)
                        setShowRecognition(true)
                      }}
                      className="p-1.5 rounded-lg"
                      style={{
                        backgroundColor: `${theme.colors.accent}20`,
                        color: theme.colors.accent
                      }}
                      title="Poslat uznání"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekly Goal Setting (Motivation 3.0 - Autonomy) */}
                {editingGoalChildId === child.id && (
                  <div
                    className="mb-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${theme.colors.primary}10` }}
                  >
                    <p className="text-xs mb-2" style={{ color: theme.colors.primary }}>
                      💡 Nastavte cíl společně s dítětem (Autonomie)
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.colors.text }}>
                        Dnů učení týdně:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateWeeklyGoal(child.id, (child.weekly_goal_days || 3) - 1)}
                          disabled={(child.weekly_goal_days || 3) <= 1}
                          className="p-1 rounded disabled:opacity-30"
                          style={{ backgroundColor: theme.colors.backgroundLight }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-bold w-6 text-center" style={{ color: theme.colors.primary }}>
                          {child.weekly_goal_days || 3}
                        </span>
                        <button
                          onClick={() => updateWeeklyGoal(child.id, (child.weekly_goal_days || 3) + 1)}
                          disabled={(child.weekly_goal_days || 3) >= 7}
                          className="p-1 rounded disabled:opacity-30"
                          style={{ backgroundColor: theme.colors.backgroundLight }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1" style={{ color: theme.colors.primary }}>
                    <Heart className="w-3 h-3" />
                    {child.adventure_points || 0}
                  </span>
                  <span style={{ color: theme.colors.textMuted }}>
                    <Target className="w-3 h-3 inline mr-1" />
                    {child.weekly_goal_days || 3} dní/týden
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
          <div className="space-y-4">
            {pendingActivities.map((item) => {
              const skillArea = item.activity?.skill_area

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: theme.colors.backgroundLight }}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold" style={{ color: theme.colors.primary }}>
                          {item.user?.username}
                        </span>
                        <span style={{ color: theme.colors.textMuted }}>•</span>
                        <span style={{ color: theme.colors.text }}>{item.activity?.name}</span>
                        {skillArea && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: `${skillArea.color}20`,
                              color: skillArea.color
                            }}
                          >
                            {skillArea.name}
                          </span>
                        )}
                      </div>

                      {item.score !== null && (
                        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                          Skóre: <span className="font-bold">{item.score}/{item.activity?.max_score || 100}</span>
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-sm mt-1 italic" style={{ color: theme.colors.textMuted }}>
                          "{item.notes}"
                        </p>
                      )}

                      <p className="text-sm mt-2" style={{ color: theme.colors.primary }}>
                        +{item.activity?.adventure_points || 10} bodů k dobrodružství
                      </p>
                    </div>

                    {/* Optional message input - per activity */}
                    <input
                      type="text"
                      placeholder="Přidat vzkaz (volitelné)..."
                      value={approvalMessages[item.id] || ''}
                      onChange={(e) => setApprovalMessages(prev => ({
                        ...prev,
                        [item.id]: e.target.value
                      }))}
                      className="px-3 py-2 rounded-lg border bg-transparent text-sm focus:outline-none"
                      style={{
                        borderColor: theme.colors.backgroundLight,
                        color: theme.colors.text
                      }}
                      disabled={processingId !== null}
                    />

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
                        className="flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                            Schválit
                          </>
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

      {/* Pending Reward Requests */}
      {pendingRewardRequests.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6 border-2"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.backgroundLight
          }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Gift className="w-5 h-5" style={{ color: '#eab308' }} />
            Žádosti o odměny ({pendingRewardRequests.length})
          </h2>

          <div className="space-y-3">
            {pendingRewardRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.colors.backgroundLight }}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold" style={{ color: theme.colors.primary }}>
                        {request.user?.username}
                      </span>
                      <span style={{ color: theme.colors.textMuted }}>chce:</span>
                    </div>
                    <p className="font-bold text-lg" style={{ color: theme.colors.text }}>
                      {request.reward_name}
                    </p>
                    {request.reward_description && (
                      <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>
                        {request.reward_description}
                      </p>
                    )}
                    <p className="text-sm mt-2" style={{ color: '#eab308' }}>
                      Za {request.points_spent} bodů
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewRewardRequest(request.id, false)}
                      disabled={processingRewardId === request.id}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      {processingRewardId === request.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => reviewRewardRequest(request.id, true)}
                      disabled={processingRewardId === request.id}
                      className="flex-1 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e'
                      }}
                    >
                      {processingRewardId === request.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Schválit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Rewards - waiting to be fulfilled */}
      {approvedRewardRequests.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6 border-2"
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.backgroundLight
          }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Star className="w-5 h-5" style={{ color: '#22c55e' }} />
            Schválené odměny k předání ({approvedRewardRequests.length})
          </h2>

          <div className="space-y-3">
            {approvedRewardRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: theme.colors.backgroundLight }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: theme.colors.primary }}>
                      {request.user?.username}
                    </span>
                  </div>
                  <p className="font-bold" style={{ color: theme.colors.text }}>
                    {request.reward_name}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Schváleno {request.reviewed_at && new Date(request.reviewed_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>

                <button
                  onClick={() => fulfillRewardRequest(request.id)}
                  disabled={processingRewardId === request.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#22c55e'
                  }}
                >
                  {processingRewardId === request.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Splněno
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy: Pending Purchases */}
      {pendingPurchases.length > 0 && (
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
        </div>
      )}
    </main>
  )
}
