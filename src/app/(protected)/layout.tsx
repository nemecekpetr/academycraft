'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { getLevelFromXpWithTheme } from '@/lib/themes'
import {
  LogOut,
  Menu,
  X,
  Shield,
  Settings
} from 'lucide-react'

interface Profile {
  username: string
  role: string
  xp: number
  emeralds: number
  adventure_points: number
  theme: string | null
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, themeId } = useTheme()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const checkAuth = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, role, xp, emeralds, adventure_points, theme')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  // Note: Shop removed from student navigation (Motivation 3.0: "if-then" rewards undermine intrinsic motivation)
  // Parents/admins can still access it via /shop directly
  const navItems = [
    { href: '/dashboard', iconKey: 'home' as const, label: 'Domov' },
    { href: '/quests', iconKey: 'quests' as const, label: 'Questy' },
    { href: '/adventures', iconKey: 'shop' as const, label: 'Dobrodružství' },
    { href: '/profile', iconKey: 'profile' as const, label: 'Profil' },
  ]

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: theme.colors.backgroundLight }}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64 border-r-2 flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        {/* Logo & User Info */}
        <div className="p-4 border-b-2 shrink-0" style={{ borderColor: theme.colors.backgroundLight }}>
          <Link href="/dashboard" className="block">
            <h1 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
              {theme.icon} AcademyCraft
            </h1>
          </Link>
          {profile && (() => {
            const level = getLevelFromXpWithTheme(profile.xp, themeId)
            const isStudent = profile.role === 'student'

            return (
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.backgroundLight }}>
                <div className="flex items-center justify-between">
                  <p className="font-medium" style={{ color: theme.colors.text }}>{profile.username}</p>
                  <span className="text-lg" title={level.name}>{level.icon}</span>
                </div>

                {/* Level badge - shown to everyone, but without XP for students (Motivation 3.0) */}
                <div
                  className="mt-2 px-2 py-1 rounded text-xs font-bold inline-block"
                  style={{ backgroundColor: `${level.color}20`, color: level.color }}
                >
                  {level.name}
                </div>

                {/* For students: Show adventure points (family contribution) instead of XP */}
                {isStudent ? (
                  <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: theme.colors.primary }}>
                    <span>❤️</span>
                    <span className="font-medium">{profile.adventure_points || 0}</span>
                    <span className="text-xs opacity-70">bodů pro rodinu</span>
                  </div>
                ) : (
                  /* For admin/parent: Show XP for reference */
                  <div className="mt-2 text-xs" style={{ color: theme.colors.textMuted }}>
                    {profile.xp} XP • {profile.emeralds} {theme.colors.currencyName}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto min-h-0">
          {navItems.map(({ href, iconKey, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive ? `${theme.colors.primary}20` : 'transparent',
                  color: isActive ? theme.colors.primary : theme.colors.textMuted
                }}
              >
                <span className="text-xl">{theme.icons[iconKey]}</span>
                {label}
              </Link>
            )
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-[var(--color-legendary)] hover:bg-[var(--color-legendary)]/10"
            >
              <Shield className="w-5 h-5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t-2 shrink-0" style={{ borderColor: theme.colors.backgroundLight }}>
          <Link
            href="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1"
            style={{
              backgroundColor: pathname === '/settings' ? `${theme.colors.primary}20` : 'transparent',
              color: pathname === '/settings' ? theme.colors.primary : theme.colors.textMuted
            }}
          >
            <Settings className="w-5 h-5" />
            Nastavení
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Odhlásit se
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
