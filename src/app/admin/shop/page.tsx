'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LEVELS } from '@/lib/levels'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  ShoppingBag,
  Gem,
  Lock
} from 'lucide-react'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  icon: string
  is_active: boolean
  min_level: number
  created_at: string
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 10,
    icon: 'gift',
    is_active: true,
    min_level: 1,
  })

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    let filtered = items

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        i => i.name?.toLowerCase().includes(query) ||
             i.description?.toLowerCase().includes(query)
      )
    }

    setFilteredItems(filtered)
  }, [items, searchQuery])

  async function loadItems() {
    const supabase = createClient()
    const { data, error: queryError } = await supabase
      .from('shop_items')
      .select('*')
      .order('price', { ascending: true })

    console.log('Shop items loaded:', data, queryError)

    if (queryError) {
      setError(queryError.message)
      console.error('Error loading shop items:', queryError)
    } else if (data) {
      setItems(data)
      setFilteredItems(data)
    }
    setLoading(false)
  }

  function openCreateModal() {
    setEditingItem(null)
    setForm({
      name: '',
      description: '',
      price: 10,
      icon: 'gift',
      is_active: true,
      min_level: 1,
    })
    setShowModal(true)
  }

  function openEditModal(item: ShopItem) {
    setEditingItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      icon: item.icon || 'gift',
      is_active: item.is_active,
      min_level: item.min_level || 1,
    })
    setShowModal(true)
  }

  async function saveItem() {
    setSaving(true)
    const supabase = createClient()

    if (editingItem) {
      const { error } = await supabase
        .from('shop_items')
        .update(form)
        .eq('id', editingItem.id)

      if (!error) {
        setItems(items.map(i =>
          i.id === editingItem.id ? { ...i, ...form } : i
        ))
      }
    } else {
      const { data, error } = await supabase
        .from('shop_items')
        .insert(form)
        .select()
        .single()

      if (!error && data) {
        setItems([data, ...items])
      }
    }

    setSaving(false)
    setShowModal(false)
  }

  async function deleteItem(id: string) {
    if (!confirm('Opravdu chceš smazat tuto položku?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('shop_items')
      .delete()
      .eq('id', id)

    if (!error) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  async function toggleActive(item: ShopItem) {
    const supabase = createClient()
    const { error } = await supabase
      .from('shop_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)

    if (!error) {
      setItems(items.map(i =>
        i.id === item.id ? { ...i, is_active: !item.is_active } : i
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
          <h1 className="text-3xl font-bold text-white mb-2">Obchod</h1>
          <p className="text-[var(--foreground-muted)]">
            Správa odměn v obchodě
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Přidat odměnu
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
            placeholder="Hledat odměny..."
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f1a] border border-[#2a2a4e] rounded-lg text-white placeholder-[var(--foreground-muted)] focus:border-[var(--color-legendary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="text-sm text-[var(--foreground-muted)] mb-4">
        Nalezeno: {filteredItems.length} odměn
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-[#0f0f1a] border rounded-xl overflow-hidden ${
              item.is_active ? 'border-[#2a2a4e]' : 'border-red-500/30 opacity-60'
            }`}
          >
            <div className="h-32 bg-[#1a1a2e] flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[var(--foreground-muted)]" />
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white">{item.name}</h3>
                  {item.min_level > 1 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] mt-1">
                      <Lock className="w-3 h-3" />
                      Min. Lv.{item.min_level}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[var(--color-emerald)] font-bold">
                  <Gem className="w-4 h-4" />
                  {item.price}
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-[var(--foreground-muted)] mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a4e]">
                <button
                  onClick={() => toggleActive(item)}
                  className={`text-xs px-2 py-1 rounded ${
                    item.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {item.is_active ? 'Aktivní' : 'Neaktivní'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 hover:bg-[#2a2a4e] rounded-lg transition-colors"
                    title="Upravit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Smazat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

      {filteredItems.length === 0 && !error && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          Žádné odměny nenalezeny
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a4e] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Upravit odměnu' : 'Nová odměna'}
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
                  placeholder="Název odměny"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Popis</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Popis odměny"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Cena (smaragdy)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Min. level</label>
                  <select
                    value={form.min_level}
                    onChange={(e) => setForm({ ...form, min_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                  >
                    {LEVELS.map((level) => (
                      <option key={level.level} value={level.level}>
                        Lv.{level.level} {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2a4e]"
                />
                <label htmlFor="is_active" className="text-sm text-white">Aktivní (dostupná k nákupu)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={saveItem}
                  disabled={saving || !form.name}
                  className="flex-1 px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingItem ? 'Uložit' : 'Vytvořit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
