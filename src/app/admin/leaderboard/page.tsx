'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelFromXpWithTheme } from '@/lib/themes'
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Star,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  email: string
  xp: number
  emeralds: number
  current_streak: number
  longest_streak: number
  theme: string | null
  created_at: string
}

type TimeFilter = 'all' | 'week' | 'month'

export default function AdminLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalXp: 0,
    avgXp: 0,
    activeThisWeek: 0,
  })

  useEffect(() => {
    loadLeaderboard()
  }, [timeFilter])

  async function loadLeaderboard() {
    setLoading(true)
    const supabase = createClient()

    if (timeFilter === 'all') {
      const { data: students, count } = await supabase
        .from('profiles')
        .select('id, username, email, xp, emeralds, current_streak, longest_streak, theme, created_at', { count: 'exact' })
        .eq('role', 'student')
        .order('xp', { ascending: false })

      if (students) {
        setEntries(students)
        const totalXp = students.reduce((sum, s) => sum + s.xp, 0)
        setStats({
          totalStudents: count || students.length,
          totalXp,
          avgXp: students.length > 0 ? Math.round(totalXp / students.length) : 0,
          activeThisWeek: students.filter(s => s.current_streak > 0).length,
        })
      }
    } else {
      const now = new Date()
      let startDate: Date

      if (timeFilter === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
      }

      const { data: activityXp } = await supabase
        .from('completed_activities')
        .select('user_id, xp_earned')
        .eq('status', 'approved')
        .gte('reviewed_at', startDate.toISOString())

      const { data: students, count } = await supabase
        .from('profiles')
        .select('id, username, email, xp, emeralds, current_streak, longest_streak, theme, created_at', { count: 'exact' })
        .eq('role', 'student')

      if (students && activityXp) {
        const xpByUser: Record<string, number> = {}
        activityXp.forEach(a => {
          xpByUser[a.user_id] = (xpByUser[a.user_id] || 0) + (a.xp_earned || 0)
        })

        const entriesWithPeriodXp = students.map(s => ({
          ...s,
          xp: xpByUser[s.id] || 0
        }))

        entriesWithPeriodXp.sort((a, b) => b.xp - a.xp)

        setEntries(entriesWithPeriodXp)
        const totalXp = entriesWithPeriodXp.reduce((sum, s) => sum + s.xp, 0)
        const activeCount = entriesWithPeriodXp.filter(s => s.xp > 0).length
        setStats({
          totalStudents: count || students.length,
          totalXp,
          avgXp: activeCount > 0 ? Math.round(totalXp / activeCount) : 0,
          activeThisWeek: activeCount,
        })
      }
    }

    setLoading(false)
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 text-center font-bold">{rank}</span>
    }
  }

  function getRankBg(rank: number) {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/10 border-l-4 border-yellow-500'
      case 2:
        return 'bg-gray-400/10 border-l-4 border-gray-400'
      case 3:
        return 'bg-amber-600/10 border-l-4 border-amber-600'
      default:
        return ''
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[var(--color-gold)]" />
          Žebříček studentů
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Přehled výkonnosti všech studentů
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-[var(--color-rare)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Celkem studentů</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-[var(--color-xp-green)]" />
            <span className="text-sm text-[var(--foreground-muted)]">
              {timeFilter === 'all' ? 'Celkem XP' : timeFilter === 'week' ? 'XP tento týden' : 'XP tento měsíc'}
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-xp-green)]">{stats.totalXp.toLocaleString()}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-emerald)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Průměr XP</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-emerald)]">{stats.avgXp}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--foreground-muted)]">
              {timeFilter === 'all' ? 'Aktivních (streak)' : 'Aktivních'}
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{stats.activeThisWeek}</p>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'Celkově', icon: Trophy },
          { id: 'week', label: 'Tento týden', icon: Calendar },
          { id: 'month', label: 'Tento měsíc', icon: Calendar },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id as TimeFilter)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              timeFilter === filter.id
                ? 'bg-[var(--color-legendary)] text-white'
                : 'bg-[#0f0f1a] border border-[#2a2a4e] text-[var(--foreground-muted)] hover:border-[var(--color-legendary)]'
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4e]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">#</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Student</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Level</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">XP</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Smaragdy</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Streak</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Nejdelší</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const rank = index + 1
                const level = getLevelFromXpWithTheme(entry.xp, entry.theme || 'minecraft')

                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#2a2a4e] hover:bg-[#1a1a2e] ${getRankBg(rank)}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${level.color}20` }}
                        >
                          {level.icon}
                        </div>
                        <div>
                          <div className="font-medium text-white">{entry.username}</div>
                          <div className="text-sm text-[var(--foreground-muted)]">{entry.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 rounded text-sm font-medium"
                        style={{ backgroundColor: `${level.color}20`, color: level.color }}
                      >
                        Lv.{level.level} {level.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-[var(--color-xp-green)]">{entry.xp.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-[var(--color-emerald)]">{entry.emeralds}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {entry.current_streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                          <Flame className="w-4 h-4" />
                          {entry.current_streak}
                        </span>
                      ) : (
                        <span className="text-[var(--foreground-muted)]">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--foreground-muted)]">
                      {entry.longest_streak}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-8 text-center text-[var(--foreground-muted)]">
            Žádní studenti k zobrazení
          </div>
        )}
      </div>

      {/* Top Performers Summary */}
      {entries.length >= 3 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* XP Leader */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-yellow-400">XP Leader</span>
            </div>
            <p className="text-2xl font-bold text-white">{entries[0].username}</p>
            <p className="text-yellow-400">{entries[0].xp.toLocaleString()} XP</p>
          </div>

          {/* Streak Leader */}
          {(() => {
            const streakLeader = [...entries].sort((a, b) => b.current_streak - a.current_streak)[0]
            if (!streakLeader || streakLeader.current_streak === 0) return null
            return (
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-6 h-6 text-orange-500" />
                  <span className="font-bold text-orange-500">Streak Leader</span>
                </div>
                <p className="text-2xl font-bold text-white">{streakLeader.username}</p>
                <p className="text-orange-500">{streakLeader.current_streak} dní v řadě</p>
              </div>
            )
          })()}

          {/* Emerald Leader */}
          {(() => {
            const emeraldLeader = [...entries].sort((a, b) => b.emeralds - a.emeralds)[0]
            return (
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">💎</span>
                  <span className="font-bold text-emerald-400">Emerald Leader</span>
                </div>
                <p className="text-2xl font-bold text-white">{emeraldLeader.username}</p>
                <p className="text-emerald-400">{emeraldLeader.emeralds} smaragdů</p>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
