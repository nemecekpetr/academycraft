'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Ban,
  CheckCircle,
  User,
  Users,
  Crown,
  Gem,
  X,
  Save,
  Loader2
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  username: string
  full_name: string | null
  role: 'student' | 'parent' | 'admin'
  parent_id: string | null
  xp: number
  emeralds: number
  current_streak: number
  longest_streak: number
  is_banned: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    let filtered = users

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        u => u.username?.toLowerCase().includes(query) ||
             u.email?.toLowerCase().includes(query) ||
             u.full_name?.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter])

  async function loadUsers() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
      setFilteredUsers(data)
    }
    setLoading(false)
  }

  async function saveUser() {
    if (!selectedUser) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        username: editForm.username,
        full_name: editForm.full_name,
        role: editForm.role,
        parent_id: editForm.parent_id,
        xp: editForm.xp,
        emeralds: editForm.emeralds,
        is_banned: editForm.is_banned,
      })
      .eq('id', selectedUser.id)

    if (!error) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u))
      setSelectedUser({ ...selectedUser, ...editForm } as Profile)
      setEditMode(false)
    }

    setSaving(false)
  }

  async function deleteUser(id: string) {
    if (!confirm('Opravdu chceš smazat tohoto uživatele? Tato akce je nevratná.')) return

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== id))
        setSelectedUser(null)
      } else {
        const data = await response.json()
        alert(`Chyba při mazání: ${data.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Nepodařilo se smazat uživatele')
    }
  }

  async function toggleBan(user: Profile) {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !user.is_banned })
      .eq('id', user.id)

    if (!error) {
      const updated = { ...user, is_banned: !user.is_banned }
      setUsers(users.map(u => u.id === user.id ? updated : u))
      if (selectedUser?.id === user.id) {
        setSelectedUser(updated)
      }
    }
  }

  function openUserDetail(user: Profile) {
    setSelectedUser(user)
    setEditForm(user)
    setEditMode(false)
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-[var(--color-legendary)]" />
      case 'parent': return <Users className="w-4 h-4 text-[var(--color-rare)]" />
      default: return <User className="w-4 h-4 text-[var(--color-grass)]" />
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'admin': return 'bg-[var(--color-legendary)]/20 text-[var(--color-legendary)]'
      case 'parent': return 'bg-[var(--color-rare)]/20 text-[var(--color-rare)]'
      default: return 'bg-[var(--color-grass)]/20 text-[var(--color-grass)]'
    }
  }

  function getParentName(parentId: string | null) {
    if (!parentId) return null
    const parent = users.find(u => u.id === parentId)
    return parent?.username || 'Neznámý'
  }

  function getChildren(parentId: string) {
    return users.filter(u => u.parent_id === parentId)
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
        <h1 className="text-3xl font-bold text-white mb-2">Uživatelé</h1>
        <p className="text-[var(--foreground-muted)]">
          Správa všech uživatelů v systému
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat uživatele..."
            className="w-full pl-12 pr-4 py-3 bg-[#0f0f1a] border border-[#2a2a4e] rounded-lg text-white placeholder-[var(--foreground-muted)] focus:border-[var(--color-legendary)] focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-[#0f0f1a] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
        >
          <option value="all">Všechny role</option>
          <option value="student">Studenti</option>
          <option value="parent">Rodiče</option>
          <option value="admin">Admini</option>
        </select>
      </div>

      <div className="text-sm text-[var(--foreground-muted)] mb-4">
        Nalezeno: {filteredUsers.length} uživatelů
      </div>

      {/* Users Table */}
      <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4e]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Uživatel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">XP</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Smaragdy</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#2a2a4e] hover:bg-[#1a1a2e] cursor-pointer"
                  onClick={() => openUserDetail(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2a2a4e] rounded-full flex items-center justify-center font-bold">
                        {user.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.username}</div>
                        <div className="text-sm text-[var(--foreground-muted)]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-xp-green)]">{user.xp}</td>
                  <td className="px-6 py-4 text-[var(--color-emerald)]">{user.emeralds}</td>
                  <td className="px-6 py-4">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <Ban className="w-3 h-3" />
                        Blokován
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Aktivní
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBan(user) }}
                      className={`p-2 rounded-lg transition-colors ${user.is_banned ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-red-500/20 text-red-400'}`}
                      title={user.is_banned ? 'Odblokovat' : 'Zablokovat'}
                    >
                      {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteUser(user.id) }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Smazat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a4e] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Detail uživatele</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-[#2a2a4e] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#2a2a4e] rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedUser.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  {editMode ? (
                    <input
                      type="text"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="text-xl font-bold bg-[#1a1a2e] border border-[#2a2a4e] rounded px-2 py-1 text-white"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-white">{selectedUser.username}</h3>
                  )}
                  <p className="text-[var(--foreground-muted)]">{selectedUser.email}</p>
                </div>
              </div>

              {selectedUser.is_banned && (
                <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg text-red-400 flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Tento uživatel je zablokován
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1a2e] p-4 rounded-lg text-center">
                  {editMode ? (
                    <input
                      type="number"
                      value={editForm.xp || 0}
                      onChange={(e) => setEditForm({ ...editForm, xp: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xl font-bold bg-[#0f0f1a] border border-[#2a2a4e] rounded px-2 py-1 text-[var(--color-xp-green)]"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-[var(--color-xp-green)]">{selectedUser.xp}</div>
                  )}
                  <div className="text-xs text-[var(--foreground-muted)]">XP</div>
                </div>
                <div className="bg-[#1a1a2e] p-4 rounded-lg text-center">
                  {editMode ? (
                    <input
                      type="number"
                      value={editForm.emeralds || 0}
                      onChange={(e) => setEditForm({ ...editForm, emeralds: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xl font-bold bg-[#0f0f1a] border border-[#2a2a4e] rounded px-2 py-1 text-[var(--color-emerald)]"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-[var(--color-emerald)]">{selectedUser.emeralds}</div>
                  )}
                  <div className="text-xs text-[var(--foreground-muted)]">Smaragdy</div>
                </div>
                <div className="bg-[#1a1a2e] p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-[var(--color-gold)]">{selectedUser.current_streak}</div>
                  <div className="text-xs text-[var(--foreground-muted)]">Streak</div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Role</label>
                {editMode ? (
                  <select
                    value={editForm.role || 'student'}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Profile['role'] })}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white"
                  >
                    <option value="student">Student</option>
                    <option value="parent">Rodič</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                    {getRoleIcon(selectedUser.role)}
                    {selectedUser.role}
                  </span>
                )}
              </div>

              {/* Parent assignment - only for students */}
              {selectedUser.role === 'student' && (
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Rodič</label>
                  {editMode ? (
                    <select
                      value={editForm.parent_id || ''}
                      onChange={(e) => setEditForm({ ...editForm, parent_id: e.target.value || null })}
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white"
                    >
                      <option value="">Bez rodiče</option>
                      {users.filter(u => u.role === 'parent').map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.username} ({parent.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-white">
                      {getParentName(selectedUser.parent_id) || 'Nepřiřazen'}
                    </span>
                  )}
                </div>
              )}

              {/* Children - only for parents */}
              {selectedUser.role === 'parent' && (
                <div>
                  <label className="block text-sm text-[var(--foreground-muted)] mb-2">Děti</label>
                  <div className="space-y-2">
                    {getChildren(selectedUser.id).length === 0 ? (
                      <p className="text-[var(--foreground-muted)]">Žádné přiřazené děti</p>
                    ) : (
                      getChildren(selectedUser.id).map(child => (
                        <div key={child.id} className="flex items-center justify-between bg-[#1a1a2e] p-2 rounded-lg">
                          <span className="text-white">{child.username}</span>
                          <span className="text-xs text-[var(--foreground-muted)]">{child.email}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-sm text-[var(--foreground-muted)]">
                <p>Registrován: {new Date(selectedUser.created_at).toLocaleDateString('cs-CZ')}</p>
                <p>Nejdelší streak: {selectedUser.longest_streak} dní</p>
                <p className="font-mono text-xs mt-2 break-all">ID: {selectedUser.id}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#2a2a4e]">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors"
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={saveUser}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Uložit
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Upravit
                    </button>
                    <button
                      onClick={() => toggleBan(selectedUser)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedUser.is_banned
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                      }`}
                    >
                      {selectedUser.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      {selectedUser.is_banned ? 'Odblokovat' : 'Zablokovat'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
