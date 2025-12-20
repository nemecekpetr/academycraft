'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Scroll, ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react'

interface Stats {
  totalUsers: number
  students: number
  parents: number
  totalActivities: number
  pendingActivities: number
  approvedActivities: number
  totalPurchases: number
  pendingPurchases: number
  totalXp: number
  totalEmeralds: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const supabase = createClient()

    const [
      { count: totalUsers },
      { count: students },
      { count: parents },
      { count: totalActivities },
      { count: pendingActivities },
      { count: approvedActivities },
      { count: totalPurchases },
      { count: pendingPurchases },
      { data: profiles },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
      supabase.from('completed_activities').select('*', { count: 'exact', head: true }),
      supabase.from('completed_activities').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('completed_activities').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('purchases').select('*', { count: 'exact', head: true }),
      supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('xp, emeralds'),
    ])

    setStats({
      totalUsers: totalUsers || 0,
      students: students || 0,
      parents: parents || 0,
      totalActivities: totalActivities || 0,
      pendingActivities: pendingActivities || 0,
      approvedActivities: approvedActivities || 0,
      totalPurchases: totalPurchases || 0,
      pendingPurchases: pendingPurchases || 0,
      totalXp: profiles?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0,
      totalEmeralds: profiles?.reduce((sum, p) => sum + (p.emeralds || 0), 0) || 0,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Celkem uživatelů',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'var(--color-emerald)',
      subtext: `${stats?.students} studentů, ${stats?.parents} rodičů`
    },
    {
      label: 'Aktivity',
      value: stats?.totalActivities || 0,
      icon: Scroll,
      color: 'var(--color-gold)',
      subtext: `${stats?.approvedActivities} schváleno`
    },
    {
      label: 'Nákupy',
      value: stats?.totalPurchases || 0,
      icon: ShoppingBag,
      color: 'var(--color-rare)',
      subtext: `${stats?.pendingPurchases} čeká`
    },
    {
      label: 'Celkem XP',
      value: stats?.totalXp?.toLocaleString() || 0,
      icon: TrendingUp,
      color: 'var(--color-xp-green)',
      subtext: 'v systému'
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[var(--foreground-muted)]">
          Přehled systému AcademyCraft
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-[var(--foreground-muted)]">{stat.label}</div>
            <div className="text-xs text-[var(--foreground-muted)] mt-1">{stat.subtext}</div>
          </div>
        ))}
      </div>

      {/* Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-[var(--color-gold)]" />
            <h2 className="text-lg font-bold text-white">Čekající na schválení</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <div className="flex items-center gap-3">
                <Scroll className="w-5 h-5 text-[var(--color-gold)]" />
                <span>Aktivity</span>
              </div>
              <span className="px-3 py-1 bg-[var(--color-gold)]/20 text-[var(--color-gold)] rounded-full font-bold">
                {stats?.pendingActivities || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[var(--color-rare)]" />
                <span>Nákupy</span>
              </div>
              <span className="px-3 py-1 bg-[var(--color-rare)]/20 text-[var(--color-rare)] rounded-full font-bold">
                {stats?.pendingPurchases || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-[var(--color-emerald)]" />
            <h2 className="text-lg font-bold text-white">Ekonomika</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <span>Celkem XP v systému</span>
              <span className="text-[var(--color-xp-green)] font-bold">
                {stats?.totalXp?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <span>Celkem smaragdů v oběhu</span>
              <span className="text-[var(--color-emerald)] font-bold">
                {stats?.totalEmeralds?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
