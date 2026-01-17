'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Shield,
  Users,
  Scroll,
  Compass,
  LayoutDashboard,
  LogOut,
  Settings,
  Menu,
  X,
  ClipboardCheck,
  Gift,
  Trophy
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  // Start as null to differentiate "not checked yet" from "checked and failed"
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const checkAdminAuth = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setAuthState('unauthenticated')
      router.push('/admin/login')
      return
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      setAuthState('unauthenticated')
      router.push('/dashboard')
      return
    }

    setAuthState('authenticated')
  }, [router])

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setAuthState('authenticated') // Login page doesn't need auth check
      return
    }

    checkAdminAuth()
  }, [pathname, checkAdminAuth])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Loading state - show spinner, don't render children yet
  // This prevents any side effects in children from running before auth check
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Unauthenticated - show redirecting message
  // Middleware should handle redirect, but this is a fallback
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--foreground-muted)]">Přesměrování...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/approvals', icon: ClipboardCheck, label: 'Schvalování' },
    { href: '/admin/purchases', icon: Gift, label: 'Nákupy' },
    { href: '/admin/users', icon: Users, label: 'Uživatelé' },
    { href: '/admin/leaderboard', icon: Trophy, label: 'Přehled' },
    { href: '/admin/activities', icon: Scroll, label: 'Aktivity' },
    { href: '/admin/shop', icon: Compass, label: 'Dobrodružství' },
    { href: '/admin/settings', icon: Settings, label: 'Nastavení' },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#2a2a4e] rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-[#0f0f1a] border-r border-[#2a2a4e]
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-[#2a2a4e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-legendary)]/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--color-legendary)]" />
            </div>
            <div>
              <h1 className="font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-[var(--foreground-muted)]">AcademyCraft</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-[var(--color-legendary)]/20 text-[var(--color-legendary)]'
                    : 'text-[var(--foreground-muted)] hover:bg-[#2a2a4e] hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2a2a4e]">
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
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
