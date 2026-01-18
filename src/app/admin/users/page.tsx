'use client'

import { useState, useEffect } from 'react'
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
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const USERS_PER_PAGE = 20

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
  last_activity_date: string | null
  activities_count: number
  learning_days_count: number
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    role: 'student' as 'student' | 'parent',
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

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
    setCurrentPage(1)
  }, [users, searchQuery, roleFilter])

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE)

  async function loadUsers() {
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load users')
        setLoading(false)
        return
      }

      setUsers(result.data || [])
      setFilteredUsers(result.data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Nepodařilo se načíst uživatele')
    }
    setLoading(false)
  }

  async function saveUser() {
    if (!selectedUser) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          username: editForm.username,
          full_name: editForm.full_name,
          role: editForm.role,
          parent_id: editForm.parent_id,
          xp: editForm.xp,
          emeralds: editForm.emeralds,
          is_banned: editForm.is_banned,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se uložit změny')
        setSaving(false)
        return
      }

      const updatedUser = result.user
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u))
      setSelectedUser(updatedUser)
      setEditMode(false)
    } catch (err) {
      console.error('Error saving user:', err)
      setError('Nepodařilo se uložit změny')
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
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Nepodařilo se smazat uživatele')
    }
  }

  async function toggleBan(user: Profile) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          is_banned: !user.is_banned,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const updatedUser = result.user
        setUsers(users.map(u => u.id === user.id ? updatedUser : u))
        if (selectedUser?.id === user.id) {
          setSelectedUser(updatedUser)
        }
      } else {
        const data = await response.json()
        alert(`Chyba: ${data.error || 'Nepodařilo se změnit stav'}`)
      }
    } catch (err) {
      console.error('Error toggling ban:', err)
      alert('Nepodařilo se změnit stav uživatele')
    }
  }

  function openUserDetail(user: Profile) {
    setSelectedUser(user)
    setEditForm(user)
    setEditMode(false)
    setError(null)
  }

  async function createUser() {
    setCreateError(null)

    if (!createForm.email || !createForm.password || !createForm.username) {
      setCreateError('Vyplň všechna povinná pole')
      return
    }

    if (createForm.password.length < 8) {
      setCreateError('Heslo musí mít alespoň 8 znaků')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (!response.ok) {
        setCreateError(data.error || 'Nepodařilo se vytvořit uživatele')
        setCreating(false)
        return
      }

      await loadUsers()

      setCreateForm({
        email: '',
        password: '',
        username: '',
        fullName: '',
        role: 'student',
      })
      setShowCreateModal(false)
    } catch (err) {
      console.error('Error creating user:', err)
      setCreateError('Nepodařilo se vytvořit uživatele')
    }

    setCreating(false)
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

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-3 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nový uživatel
        </button>
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
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Aktivity</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Dny učení</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Naposledy</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Akce</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
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
                  <td className="px-6 py-4 text-[var(--color-emerald)]">{user.activities_count}</td>
                  <td className="px-6 py-4 text-[var(--color-rare)]">{user.learning_days_count}</td>
                  <td className="px-6 py-4 text-[var(--foreground-muted)] text-sm">
                    {user.last_activity_date
                      ? new Date(user.last_activity_date).toLocaleDateString('cs-CZ')
                      : '—'}
                  </td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[var(--foreground-muted)]">
            Zobrazeno {startIndex + 1}-{Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)} z {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#2a2a4e] hover:bg-[#3a3a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              Stránka {currentPage} z {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#2a2a4e] hover:bg-[#3a3a5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#2a2a4e] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Nový uživatel</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-[#2a2a4e] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-500/20 border border-red-500 p-3 rounded-lg text-red-400 text-sm">
                  {createError}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'student' })}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      createForm.role === 'student'
                        ? 'border-[var(--color-grass)] bg-[var(--color-grass)]/10'
                        : 'border-[#2a2a4e] hover:border-gray-500'
                    }`}
                  >
                    {createForm.role === 'student' && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[var(--color-grass)]">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <User className={`w-6 h-6 mx-auto mb-1 ${createForm.role === 'student' ? 'text-[var(--color-grass)]' : 'text-gray-400'}`} />
                    <div className={`text-sm font-bold ${createForm.role === 'student' ? 'text-[var(--color-grass)]' : 'text-gray-400'}`}>
                      Student
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'parent' })}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      createForm.role === 'parent'
                        ? 'border-[var(--color-rare)] bg-[var(--color-rare)]/10'
                        : 'border-[#2a2a4e] hover:border-gray-500'
                    }`}
                  >
                    {createForm.role === 'parent' && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[var(--color-rare)]">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Users className={`w-6 h-6 mx-auto mb-1 ${createForm.role === 'parent' ? 'text-[var(--color-rare)]' : 'text-gray-400'}`} />
                    <div className={`text-sm font-bold ${createForm.role === 'parent' ? 'text-[var(--color-rare)]' : 'text-gray-400'}`}>
                      Rodič
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                  {createForm.role === 'parent' ? 'Jméno' : 'Přezdívka'} *
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder={createForm.role === 'parent' ? 'Jan Novák' : 'Přezdívka'}
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Celé jméno</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Jan Novák"
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--foreground-muted)] mb-2">Heslo *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Alespoň 8 znaků"
                  className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#2a2a4e] hover:bg-[#3a3a5e] rounded-lg transition-colors"
                >
                  Zrušit
                </button>
                <button
                  onClick={createUser}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Vytvářím...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Vytvořit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
