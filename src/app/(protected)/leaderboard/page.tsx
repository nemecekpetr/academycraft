'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { getLevelFromXpWithTheme } from '@/lib/themes'
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ChevronUp
} from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  xp: number
  current_streak: number
  created_at: string
}

type TimeFilter = 'all' | 'week' | 'month'

export default function LeaderboardPage() {
  const { theme, themeId } = useTheme()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [loading, setLoading] = useState(true)
  const [totalStudents, setTotalStudents] = useState(0)

  useEffect(() => {
    loadLeaderboard()
  }, [timeFilter])

  async function loadLeaderboard() {
    setLoading(true)
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }

    // For weekly/monthly, we need to calculate XP earned in that period
    // For now, we'll use total XP but with filtering by activity date
    if (timeFilter === 'all') {
      // All-time leaderboard - simple query
      const { data: students, count } = await supabase
        .from('profiles')
        .select('id, username, xp, current_streak, created_at', { count: 'exact' })
        .eq('role', 'student')
        .order('xp', { ascending: false })

      if (students) {
        setEntries(students)
        setTotalStudents(count || students.length)

        // Find current user rank
        if (user) {
          const rank = students.findIndex(s => s.id === user.id)
          setCurrentUserRank(rank >= 0 ? rank + 1 : null)
        }
      }
    } else {
      // Weekly/Monthly - calculate XP from completed activities
      const now = new Date()
      let startDate: Date

      if (timeFilter === 'week') {
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 1)
      }

      // Get XP earned in the period from completed_activities
      const { data: activityXp } = await supabase
        .from('completed_activities')
        .select('user_id, xp_earned')
        .eq('status', 'approved')
        .gte('reviewed_at', startDate.toISOString())

      // Get all students
      const { data: students, count } = await supabase
        .from('profiles')
        .select('id, username, xp, current_streak, created_at', { count: 'exact' })
        .eq('role', 'student')

      if (students && activityXp) {
        // Calculate XP per user for the period
        const xpByUser: Record<string, number> = {}
        activityXp.forEach(a => {
          xpByUser[a.user_id] = (xpByUser[a.user_id] || 0) + (a.xp_earned || 0)
        })

        // Create entries with period XP
        const entriesWithPeriodXp = students.map(s => ({
          ...s,
          xp: xpByUser[s.id] || 0
        }))

        // Sort by period XP
        entriesWithPeriodXp.sort((a, b) => b.xp - a.xp)

        setEntries(entriesWithPeriodXp)
        setTotalStudents(count || students.length)

        // Find current user rank
        if (user) {
          const rank = entriesWithPeriodXp.findIndex(s => s.id === user.id)
          setCurrentUserRank(rank >= 0 ? rank + 1 : null)
        }
      }
    }

    setLoading(false)
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-lg">{rank}</span>
    }
  }

  function getRankStyle(rank: number) {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50'
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50'
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/50'
      default:
        return 'border-transparent'
    }
  }

  // Find the next person above current user
  const currentUserEntry = entries.find(e => e.id === currentUserId)
  const nextAbove = currentUserRank && currentUserRank > 1 ? entries[currentUserRank - 2] : null
  const xpToNextRank = nextAbove && currentUserEntry ? nextAbove.xp - currentUserEntry.xp + 1 : null

  // Get streak leader
  const streakLeader = [...entries].sort((a, b) => b.current_streak - a.current_streak)[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full"
          style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
        <Trophy className="inline-block w-8 h-8 mr-2 mb-1" style={{ color: theme.colors.accent }} />
        Žebříček
      </h1>
      <p className="mb-6" style={{ color: theme.colors.textMuted }}>
        Podívej se, jak jsi na tom oproti ostatním!
      </p>

      {/* Time Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'Celkově' },
          { id: 'week', label: 'Tento týden' },
          { id: 'month', label: 'Tento měsíc' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id as TimeFilter)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeFilter === filter.id
                ? 'text-white'
                : ''
            }`}
            style={{
              backgroundColor: timeFilter === filter.id ? theme.colors.primary : theme.colors.backgroundLight,
              color: timeFilter === filter.id ? '#fff' : theme.colors.textMuted,
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Current User Position Card */}
      {currentUserRank && currentUserEntry && (
        <div
          className="border-2 rounded-xl p-4 mb-6"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.primary }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Tvoje pozice</p>
              <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                #{currentUserRank}
                <span className="text-lg ml-2" style={{ color: theme.colors.textMuted }}>
                  z {totalStudents}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                {timeFilter === 'all' ? 'Celkem XP' : timeFilter === 'week' ? 'XP tento týden' : 'XP tento měsíc'}
              </p>
              <p className="text-2xl font-bold" style={{ color: theme.colors.xp }}>
                {currentUserEntry.xp} XP
              </p>
            </div>
          </div>

          {/* XP to next rank */}
          {xpToNextRank && xpToNextRank > 0 && nextAbove && (
            <div
              className="mt-4 p-3 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              <ChevronUp className="w-5 h-5" style={{ color: theme.colors.accent }} />
              <span style={{ color: theme.colors.text }}>
                Ještě <strong style={{ color: theme.colors.xp }}>{xpToNextRank} XP</strong> a předběhneš{' '}
                <strong>{nextAbove.username}</strong>!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Streak Leader */}
      {streakLeader && streakLeader.current_streak > 0 && (
        <div
          className="border rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500/20">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Streak leader</p>
              <p className="font-bold" style={{ color: theme.colors.text }}>{streakLeader.username}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-500">{streakLeader.current_streak}</p>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>dní v řadě</p>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="flex justify-center items-end gap-2 mb-8">
          {/* 2nd place */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl mx-auto mb-2 border-2 border-gray-400"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              {getLevelFromXpWithTheme(entries[1].xp, themeId).icon}
            </div>
            <div className="bg-gray-400/20 rounded-t-lg pt-2 pb-1 px-3">
              <Medal className="w-6 h-6 text-gray-300 mx-auto" />
            </div>
            <div
              className="rounded-b-lg p-2"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              <p className="font-bold text-sm truncate max-w-20" style={{ color: theme.colors.text }}>
                {entries[1].username}
              </p>
              <p className="text-xs" style={{ color: theme.colors.xp }}>{entries[1].xp} XP</p>
            </div>
          </div>

          {/* 1st place */}
          <div className="text-center -mt-4">
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center text-4xl mx-auto mb-2 border-2 border-yellow-400"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              {getLevelFromXpWithTheme(entries[0].xp, themeId).icon}
            </div>
            <div className="bg-yellow-500/20 rounded-t-lg pt-2 pb-1 px-4">
              <Crown className="w-8 h-8 text-yellow-400 mx-auto" />
            </div>
            <div
              className="rounded-b-lg p-3"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              <p className="font-bold truncate max-w-24" style={{ color: theme.colors.text }}>
                {entries[0].username}
              </p>
              <p className="text-sm" style={{ color: theme.colors.xp }}>{entries[0].xp} XP</p>
            </div>
          </div>

          {/* 3rd place */}
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl mx-auto mb-2 border-2 border-amber-600"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              {getLevelFromXpWithTheme(entries[2].xp, themeId).icon}
            </div>
            <div className="bg-amber-600/20 rounded-t-lg pt-2 pb-1 px-3">
              <Medal className="w-6 h-6 text-amber-600 mx-auto" />
            </div>
            <div
              className="rounded-b-lg p-2"
              style={{ backgroundColor: theme.colors.backgroundLight }}
            >
              <p className="font-bold text-sm truncate max-w-20" style={{ color: theme.colors.text }}>
                {entries[2].username}
              </p>
              <p className="text-xs" style={{ color: theme.colors.xp }}>{entries[2].xp} XP</p>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div
        className="border rounded-xl overflow-hidden"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <div className="p-4 border-b" style={{ borderColor: theme.colors.backgroundLight }}>
          <h2 className="font-bold" style={{ color: theme.colors.text }}>
            {timeFilter === 'all' ? 'Celkový žebříček' : timeFilter === 'week' ? 'Týdenní žebříček' : 'Měsíční žebříček'}
          </h2>
        </div>

        <div className="divide-y" style={{ borderColor: theme.colors.backgroundLight }}>
          {entries.slice(0, 20).map((entry, index) => {
            const rank = index + 1
            const level = getLevelFromXpWithTheme(entry.xp, themeId)
            const isCurrentUser = entry.id === currentUserId

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 transition-colors ${getRankStyle(rank)} ${
                  isCurrentUser ? 'ring-2 ring-inset' : ''
                }`}
                style={{
                  backgroundColor: isCurrentUser ? `${theme.colors.primary}15` : undefined,
                  borderColor: theme.colors.backgroundLight,
                  ['--tw-ring-color' as string]: isCurrentUser ? theme.colors.primary : undefined,
                }}
              >
                {/* Rank */}
                <div className="w-8 flex justify-center" style={{ color: theme.colors.textMuted }}>
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${level.color}20` }}
                >
                  {level.icon}
                </div>

                {/* Name & Level */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-bold truncate ${isCurrentUser ? 'underline' : ''}`}
                    style={{ color: theme.colors.text }}
                  >
                    {entry.username}
                    {isCurrentUser && <span className="ml-2 text-xs">(ty)</span>}
                  </p>
                  <p className="text-sm" style={{ color: level.color }}>
                    Lv.{level.level} {level.name}
                  </p>
                </div>

                {/* Streak */}
                {entry.current_streak > 0 && (
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-bold">{entry.current_streak}</span>
                  </div>
                )}

                {/* XP */}
                <div className="text-right">
                  <p className="font-bold" style={{ color: theme.colors.xp }}>
                    {entry.xp}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>XP</p>
                </div>
              </div>
            )
          })}
        </div>

        {entries.length === 0 && (
          <div className="p-8 text-center" style={{ color: theme.colors.textMuted }}>
            Žádní studenti k zobrazení
          </div>
        )}

        {entries.length > 20 && (
          <div className="p-4 text-center" style={{ color: theme.colors.textMuted }}>
            Zobrazeno top 20 z {entries.length} studentů
          </div>
        )}
      </div>
    </div>
  )
}
