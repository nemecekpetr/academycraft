'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { getLevelFromXpWithTheme, getLevelProgressWithTheme, getXpToNextLevelWithTheme } from '@/lib/themes'
import {
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react'

interface Profile {
  username: string
  role: string
  xp: number
  emeralds: number
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

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, role, xp, emeralds, theme')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
    }
    setLoading(false)
  }

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

  const navItems = [
    { href: '/dashboard', iconKey: 'home' as const, label: 'Domov' },
    { href: '/quests', iconKey: 'quests' as const, label: 'Questy' },
    { href: '/shop', iconKey: 'shop' as const, label: 'Obchod' },
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
          fixed lg:static inset-y-0 left-0 z-40
          w-64 border-r-2
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.backgroundLight
        }}
      >
        {/* Logo & User Info */}
        <div className="p-4 border-b-2" style={{ borderColor: theme.colors.backgroundLight }}>
          <Link href="/dashboard" className="block">
            <h1 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
              {theme.icon} AcademyCraft
            </h1>
          </Link>
          {profile && (() => {
            const level = getLevelFromXpWithTheme(profile.xp, themeId)
            const progress = getLevelProgressWithTheme(profile.xp, themeId)
            const xpToNext = getXpToNextLevelWithTheme(profile.xp, themeId)

            return (
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: theme.colors.backgroundLight }}>
                <div className="flex items-center justify-between">
                  <p className="font-medium" style={{ color: theme.colors.text }}>{profile.username}</p>
                  <span className="text-lg" title={level.name}>{level.icon}</span>
                </div>

                {/* Level badge */}
                <div
                  className="mt-2 px-2 py-1 rounded text-xs font-bold inline-block"
                  style={{ backgroundColor: `${level.color}20`, color: level.color }}
                >
                  Lv.{level.level} {level.name}
                </div>

                {/* XP Progress bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: theme.colors.xp }}>{profile.xp} XP</span>
                    {xpToNext !== null && (
                      <span style={{ color: theme.colors.textMuted }}>
                        dalších {xpToNext} XP
                      </span>
                    )}
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.card }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: theme.colors.xp }}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: theme.colors.currency }}>
                  <span>{theme.icons.currency}</span>
                  <span className="font-medium">{profile.emeralds}</span>
                  <span className="text-xs opacity-70">{theme.colors.currencyName}</span>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
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

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2" style={{ borderColor: theme.colors.backgroundLight }}>
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
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
