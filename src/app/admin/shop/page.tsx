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
  Compass,
  Heart,
  Star,
  Sparkles,
  ChefHat,
  Film,
  Trees,
  MapPin,
  Dice1
} from 'lucide-react'

interface AdventureTemplate {
  id: string
  name: string
  description: string | null
  suggested_points: number
  icon: string
  category: string
}

const ICON_OPTIONS = [
  { value: 'star', label: 'Hvězda', icon: Star },
  { value: 'compass', label: 'Kompas', icon: Compass },
  { value: 'dice', label: 'Kostka', icon: Dice1 },
  { value: 'chef-hat', label: 'Kuchař', icon: ChefHat },
  { value: 'film', label: 'Film', icon: Film },
  { value: 'trees', label: 'Příroda', icon: Trees },
  { value: 'map-pin', label: 'Místo', icon: MapPin },
]

const CATEGORY_OPTIONS = [
  { value: 'together', label: 'Společně doma' },
  { value: 'outdoor', label: 'Venku' },
  { value: 'special', label: 'Speciální' },
  { value: 'general', label: 'Obecné' },
]

export default function AdminAdventureTemplatesPage() {
  const [templates, setTemplates] = useState<AdventureTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<AdventureTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AdventureTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    suggested_points: 100,
    icon: 'star',
    category: 'together',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    let filtered = templates

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        t => t.name?.toLowerCase().includes(query) ||
             t.description?.toLowerCase().includes(query)
      )
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery])

  async function loadTemplates() {
    const supabase = createClient()
    const { data, error: queryError } = await supabase
      .from('adventure_templates')
      .select('*')
      .order('suggested_points', { ascending: true })

    if (queryError) {
      setError(queryError.message)
      console.error('Error loading adventure templates:', queryError)
    } else if (data) {
      setTemplates(data)
      setFilteredTemplates(data)
    }
    setLoading(false)
  }

  function openCreateModal() {
    setEditingTemplate(null)
    setForm({
      name: '',
      description: '',
      suggested_points: 100,
      icon: 'star',
      category: 'together',
    })
    setShowModal(true)
  }

  function openEditModal(template: AdventureTemplate) {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      description: template.description || '',
      suggested_points: template.suggested_points,
      icon: template.icon || 'star',
      category: template.category || 'general',
    })
    setShowModal(true)
  }

  async function saveTemplate() {
    setSaving(true)
    const supabase = createClient()

    if (editingTemplate) {
      const { error } = await supabase
        .from('adventure_templates')
        .update(form)
        .eq('id', editingTemplate.id)

      if (!error) {
        setTemplates(templates.map(t =>
          t.id === editingTemplate.id ? { ...t, ...form } : t
        ))
      }
    } else {
      const { data, error } = await supabase
        .from('adventure_templates')
        .insert(form)
        .select()
        .single()

      if (!error && data) {
        setTemplates([...templates, data].sort((a, b) => a.suggested_points - b.suggested_points))
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Opravdu chceš smazat tuto šablonu?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('adventure_templates')
      .delete()
      .eq('id', id)

    if (!error) {
      setTemplates(templates.filter(t => t.id !== id))
    }
  }

  function getIconComponent(iconName: string) {
    const option = ICON_OPTIONS.find(o => o.value === iconName)
    if (option) {
      const IconComponent = option.icon
      return <IconComponent className="w-6 h-6" />
    }
    return <Star className="w-6 h-6" />
  }

  function getCategoryLabel(category: string) {
    return CATEGORY_OPTIONS.find(c => c.value === category)?.label || category
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case 'together': return '#4AEDD9'
      case 'outdoor': return '#22C55E'
      case 'special': return '#FFD700'
      default: return '#8B5CF6'
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Compass className="w-8 h-8 text-[var(--color-gold)]" />
            Šablony dobrodružství
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Inspirace pro rodinná dobrodružství (Motivace 3.0)
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Přidat šablonu
        </button>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-purple-300 font-medium">Motivace 3.0 - Rodinná dobrodružství</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Tyto šablony slouží jako inspirace pro rodiče při vytváření společných rodinných cílů.
              Rodina společně vybírá dobrodružství a dítě svou snahou přispívá k jeho dosažení.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat šablony..."
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f1a] border border-[#2a2a4e] rounded-lg text-white placeholder-[var(--foreground-muted)] focus:border-[var(--color-legendary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="text-sm text-[var(--foreground-muted)] mb-4">
        Nalezeno: {filteredTemplates.length} šablon
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl overflow-hidden"
          >
            <div
              className="h-24 flex items-center justify-center"
              style={{ backgroundColor: `${getCategoryColor(template.category)}15` }}
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${getCategoryColor(template.category)}30`, color: getCategoryColor(template.category) }}
              >
                {getIconComponent(template.icon)}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white">{template.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                    style={{
                      backgroundColor: `${getCategoryColor(template.category)}20`,
                      color: getCategoryColor(template.category)
                    }}
                  >
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-pink-500 font-bold">
                  <Heart className="w-4 h-4" />
                  {template.suggested_points}
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-end pt-3 border-t border-[#2a2a4e] gap-2">
                <button
                  onClick={() => openEditModal(template)}
                  className="p-2 hover:bg-[#2a2a4e] rounded-lg transition-colors"
                  title="Upravit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
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

      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400 mb-4">
          Chyba: {error}
        </div>
      )}

      {filteredTemplates.length === 0 && !error && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          Žádné šablony nenalezeny
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a4e] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingTemplate ? 'Upravit šablonu' : 'Nová šablona dobrodružství'}
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
                  placeholder="Název dobrodružství"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Popis</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Co toto dobrodružství zahrnuje?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                    <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                    Doporučené body
                  </label>
                  <input
                    type="number"
                    value={form.suggested_points}
                    onChange={(e) => setForm({ ...form, suggested_points: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                    min={10}
                    step={10}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Kategorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Ikona</label>
                <div className="grid grid-cols-7 gap-2">
                  {ICON_OPTIONS.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm({ ...form, icon: option.value })}
                        className={`p-3 rounded-lg flex items-center justify-center transition-all ${
                          form.icon === option.value
                            ? 'bg-[var(--color-emerald)] text-black'
                            : 'bg-[#1a1a2e] hover:bg-[#2a2a4e]'
                        }`}
                        title={option.label}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving || !form.name}
                  className="flex-1 px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingTemplate ? 'Uložit' : 'Vytvořit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
