'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Scroll,
  Star,
  Gem,
  CheckCircle,
  UserCheck,
  Zap
} from 'lucide-react'

interface Activity {
  id: string
  name: string
  description: string
  xp_reward: number
  emerald_reward: number
  icon: string
  requires_approval: boolean
  is_active: boolean
  created_at: string
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    xp_reward: 10,
    emerald_reward: 1,
    icon: 'star',
    requires_approval: true,
    is_active: true,
  })

  useEffect(() => {
    loadActivities()
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

  async function loadActivities() {
    const supabase = createClient()
    const { data } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setActivities(data)
      setFilteredActivities(data)
    }
    setLoading(false)
  }

  function openCreateModal() {
    setEditingActivity(null)
    setForm({
      name: '',
      description: '',
      xp_reward: 10,
      emerald_reward: 1,
      icon: 'star',
      requires_approval: true,
      is_active: true,
    })
    setShowModal(true)
  }

  function openEditModal(activity: Activity) {
    setEditingActivity(activity)
    setForm({
      name: activity.name,
      description: activity.description || '',
      xp_reward: activity.xp_reward,
      emerald_reward: activity.emerald_reward,
      icon: activity.icon || 'star',
      requires_approval: activity.requires_approval,
      is_active: activity.is_active,
    })
    setShowModal(true)
  }

  async function saveActivity() {
    setSaving(true)
    const supabase = createClient()

    if (editingActivity) {
      const { error } = await supabase
        .from('activities')
        .update(form)
        .eq('id', editingActivity.id)

      if (!error) {
        setActivities(activities.map(a =>
          a.id === editingActivity.id ? { ...a, ...form } : a
        ))
      }
    } else {
      const { data, error } = await supabase
        .from('activities')
        .insert(form)
        .select()
        .single()

      if (!error && data) {
        setActivities([data, ...activities])
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  async function deleteActivity(id: string) {
    if (!confirm('Opravdu chceš smazat tuto aktivitu?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (!error) {
      setActivities(activities.filter(a => a.id !== id))
    }
  }

  async function toggleActive(activity: Activity) {
    const supabase = createClient()
    const { error } = await supabase
      .from('activities')
      .update({ is_active: !activity.is_active })
      .eq('id', activity.id)

    if (!error) {
      setActivities(activities.map(a =>
        a.id === activity.id ? { ...a, is_active: !activity.is_active } : a
      ))
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
            Správa aktivit a úkolů
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
                </div>
              </div>
              {/* Approval indicator */}
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
              <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2">
                {activity.description}
              </p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[var(--color-xp-green)]" />
                <span className="text-[var(--color-xp-green)] font-medium">{activity.xp_reward} XP</span>
              </div>
              <div className="flex items-center gap-1">
                <Gem className="w-4 h-4 text-[var(--color-emerald)]" />
                <span className="text-[var(--color-emerald)] font-medium">{activity.emerald_reward}</span>
              </div>
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
                  rows={3}
                  placeholder="Popis aktivity"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
