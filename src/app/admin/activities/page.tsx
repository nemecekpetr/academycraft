'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Scroll,
  Heart,
  CheckCircle,
  UserCheck,
  Zap,
  BookOpen,
  Calculator,
  Brain
} from 'lucide-react'

interface SkillArea {
  id: string
  name: string
  color: string
  icon: string
}

interface Activity {
  id: string
  name: string
  description: string
  xp_reward: number
  emerald_reward: number
  adventure_points: number
  icon: string
  requires_approval: boolean
  requires_score: boolean
  max_score: number | null
  is_active: boolean
  created_at: string
  skill_area_id: string | null
  purpose_message: string | null
  skill_area?: SkillArea | null
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    adventure_points: 10,
    xp_reward: 0,
    emerald_reward: 0,
    icon: 'star',
    requires_approval: true,
    requires_score: false,
    max_score: null as number | null,
    is_active: true,
    skill_area_id: null as string | null,
    purpose_message: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activities

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        a => a.name?.toLowerCase().includes(query) ||
             a.description?.toLowerCase().includes(query)
      )
    }

    setFilteredActivities(filtered)
  }, [activities, searchQuery])

  async function loadData() {
    try {
      // Load activities via API
      const activitiesRes = await fetch('/api/admin/activities')
      const activitiesResult = await activitiesRes.json()

      if (!activitiesRes.ok) {
        setError(activitiesResult.error || 'Failed to load activities')
        setLoading(false)
        return
      }

      // Normalize skill_area from array if needed
      const normalizedActivities = activitiesResult.data?.map((a: Activity) => ({
        ...a,
        skill_area: Array.isArray(a.skill_area) ? a.skill_area[0] : a.skill_area,
      })) || []

      setActivities(normalizedActivities)
      setFilteredActivities(normalizedActivities)

      // Load skill areas (we still use direct fetch for read-only data)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: skillAreasData } = await supabase
        .from('skill_areas')
        .select('*')
        .order('display_order')

      if (skillAreasData) {
        setSkillAreas(skillAreasData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Nepodařilo se načíst data')
    }
    setLoading(false)
  }

  function openCreateModal() {
    setEditingActivity(null)
    setForm({
      name: '',
      description: '',
      adventure_points: 10,
      xp_reward: 0,
      emerald_reward: 0,
      icon: 'star',
      requires_approval: true,
      requires_score: false,
      max_score: null,
      is_active: true,
      skill_area_id: null,
      purpose_message: '',
    })
    setShowModal(true)
  }

  function openEditModal(activity: Activity) {
    setEditingActivity(activity)
    setForm({
      name: activity.name,
      description: activity.description || '',
      adventure_points: activity.adventure_points || 10,
      xp_reward: activity.xp_reward,
      emerald_reward: activity.emerald_reward,
      icon: activity.icon || 'star',
      requires_approval: activity.requires_approval,
      requires_score: activity.requires_score,
      max_score: activity.max_score,
      is_active: activity.is_active,
      skill_area_id: activity.skill_area_id,
      purpose_message: activity.purpose_message || '',
    })
    setShowModal(true)
  }

  async function saveActivity() {
    setSaving(true)
    setError(null)

    try {
      const method = editingActivity ? 'PATCH' : 'POST'
      const body = editingActivity
        ? { activityId: editingActivity.id, ...form }
        : form

      const response = await fetch('/api/admin/activities', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se uložit aktivitu')
        setSaving(false)
        return
      }

      // Reload data to get fresh state with joins
      await loadData()
      setShowModal(false)
    } catch (err) {
      console.error('Error saving activity:', err)
      setError('Nepodařilo se uložit aktivitu')
    }

    setSaving(false)
  }

  async function deleteActivity(id: string) {
    if (!confirm('Opravdu chceš smazat tuto aktivitu?')) return

    try {
      const response = await fetch(`/api/admin/activities?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setActivities(activities.filter(a => a.id !== id))
      } else {
        const data = await response.json()
        alert(`Chyba: ${data.error || 'Nepodařilo se smazat aktivitu'}`)
      }
    } catch (err) {
      console.error('Error deleting activity:', err)
      alert('Nepodařilo se smazat aktivitu')
    }
  }

  async function toggleActive(activity: Activity) {
    try {
      const response = await fetch('/api/admin/activities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          is_active: !activity.is_active,
        }),
      })

      if (response.ok) {
        setActivities(activities.map(a =>
          a.id === activity.id ? { ...a, is_active: !activity.is_active } : a
        ))
      } else {
        const data = await response.json()
        alert(`Chyba: ${data.error || 'Nepodařilo se změnit stav'}`)
      }
    } catch (err) {
      console.error('Error toggling active:', err)
      alert('Nepodařilo se změnit stav aktivity')
    }
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Aktivity</h1>
          <p className="text-[var(--foreground-muted)]">
            Správa aktivit a úkolů (Motivace 3.0)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Přidat aktivitu
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat aktivity..."
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f1a] border border-[#2a2a4e] rounded-lg text-white placeholder-[var(--foreground-muted)] focus:border-[var(--color-legendary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="text-sm text-[var(--foreground-muted)] mb-4">
        Nalezeno: {filteredActivities.length} aktivit
      </div>

      {/* Activities Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className={`bg-[#0f0f1a] border rounded-xl p-6 ${
              activity.is_active ? 'border-[#2a2a4e]' : 'border-red-500/30 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-gold)]/20 rounded-lg flex items-center justify-center">
                  <Scroll className="w-5 h-5 text-[var(--color-gold)]" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{activity.name}</h3>
                  {activity.skill_area && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${activity.skill_area.color}20`,
                        color: activity.skill_area.color
                      }}
                    >
                      {activity.skill_area.name}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  activity.requires_approval
                    ? 'bg-[var(--color-legendary)]/20 text-[var(--color-legendary)]'
                    : 'bg-[var(--color-xp-green)]/20 text-[var(--color-xp-green)]'
                }`}
                title={activity.requires_approval ? 'Vyžaduje schválení rodičem' : 'Automaticky schváleno'}
              >
                {activity.requires_approval ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Schválení</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Auto</span>
                  </>
                )}
              </div>
            </div>

            {activity.description && (
              <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">
                {activity.description}
              </p>
            )}

            {activity.purpose_message && (
              <p className="text-xs text-[var(--color-emerald)] mb-3 italic line-clamp-2">
                „{activity.purpose_message}"
              </p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="text-pink-500 font-medium">{activity.adventure_points} bodů</span>
              </div>
              {activity.requires_score && activity.max_score && (
                <div className="flex items-center gap-1 text-[var(--foreground-muted)]">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">max {activity.max_score}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2a2a4e]">
              <button
                onClick={() => toggleActive(activity)}
                className={`text-xs px-2 py-1 rounded ${
                  activity.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {activity.is_active ? 'Aktivní' : 'Neaktivní'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(activity)}
                  className="p-2 hover:bg-[#2a2a4e] rounded-lg transition-colors"
                  title="Upravit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteActivity(activity.id)}
                  className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  title="Smazat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          Žádné aktivity nenalezeny
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a4e] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingActivity ? 'Upravit aktivitu' : 'Nová aktivita'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#2a2a4e] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Název</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                  placeholder="Název aktivity"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Popis</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none resize-none"
                  rows={2}
                  placeholder="Popis aktivity"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  Oblast dovedností
                </label>
                <select
                  value={form.skill_area_id || ''}
                  onChange={(e) => setForm({ ...form, skill_area_id: e.target.value || null })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                >
                  <option value="">-- Bez oblasti --</option>
                  {skillAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  Účelová zpráva (Motivace 3.0)
                </label>
                <textarea
                  value={form.purpose_message}
                  onChange={(e) => setForm({ ...form, purpose_message: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none resize-none"
                  rows={2}
                  placeholder="Proč je tato aktivita důležitá? Co se dítě naučí?"
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Tato zpráva vysvětluje smysl aktivity - proč je důležitá pro růst dítěte.
                </p>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                  Rodinné body (Adventure Points)
                </label>
                <input
                  type="number"
                  value={form.adventure_points}
                  onChange={(e) => setForm({ ...form, adventure_points: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                  min={0}
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Body přispívající k rodinnému dobrodružství
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requires_score"
                  checked={form.requires_score}
                  onChange={(e) => setForm({ ...form, requires_score: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2a4e]"
                />
                <label htmlFor="requires_score" className="text-sm text-white">Vyžaduje skóre</label>
              </div>

              {form.requires_score && (
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Maximální skóre</label>
                  <input
                    type="number"
                    value={form.max_score || ''}
                    onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || null })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                    min={1}
                    placeholder="např. 50"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requires_approval"
                  checked={form.requires_approval}
                  onChange={(e) => setForm({ ...form, requires_approval: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2a4e]"
                />
                <label htmlFor="requires_approval" className="text-sm text-white">Vyžaduje schválení rodičem</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2a4e]"
                />
                <label htmlFor="is_active" className="text-sm text-white">Aktivní</label>
              </div>

              {/* Legacy fields - collapsed */}
              <details className="border border-[#2a2a4e] rounded-lg p-3">
                <summary className="text-sm text-[var(--foreground-muted)] cursor-pointer">
                  Starý systém (XP/Emeraldy) - pro zpětnou kompatibilitu
                </summary>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm text-[var(--foreground-muted)] mb-2">XP odměna</label>
                    <input
                      type="number"
                      value={form.xp_reward}
                      onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--foreground-muted)] mb-2">Smaragdy</label>
                    <input
                      type="number"
                      value={form.emerald_reward}
                      onChange={(e) => setForm({ ...form, emerald_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                      min={0}
                    />
                  </div>
                </div>
              </details>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={saveActivity}
                  disabled={saving || !form.name}
                  className="flex-1 px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingActivity ? 'Uložit' : 'Vytvořit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
