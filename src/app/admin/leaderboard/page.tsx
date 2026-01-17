'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Calendar,
  Heart,
  Star,
  TrendingUp,
  BookOpen,
  Compass,
  Sparkles,
  Trophy
} from 'lucide-react'

interface StudentStats {
  id: string
  username: string
  email: string
  adventure_points: number
  learning_days_count: number
  skill_areas_count: number
  mastery_level: string | null
  created_at: string
}

interface CommunityStats {
  totalStudents: number
  totalLearningDays: number
  totalAdventurePoints: number
  totalAdventuresAchieved: number
  activeThisWeek: number
  avgLearningDaysPerStudent: number
}

interface SkillAreaStats {
  name: string
  color: string
  total_activities: number
  students_count: number
}

export default function AdminCommunityPage() {
  const [students, setStudents] = useState<StudentStats[]>([])
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalStudents: 0,
    totalLearningDays: 0,
    totalAdventurePoints: 0,
    totalAdventuresAchieved: 0,
    activeThisWeek: 0,
    avgLearningDaysPerStudent: 0,
  })
  const [skillAreaStats, setSkillAreaStats] = useState<SkillAreaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    loadCommunityData()
  }, [timeFilter])

  async function loadCommunityData() {
    setLoading(true)
    const supabase = createClient()

    // Calculate date range
    const now = new Date()
    let startDate: Date | null = null
    if (timeFilter === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else if (timeFilter === 'month') {
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
    }

    // Get all students
    const { data: studentsData, count: totalStudents } = await supabase
      .from('profiles')
      .select('id, username, email, adventure_points, created_at', { count: 'exact' })
      .eq('role', 'student')
      .order('adventure_points', { ascending: false })

    // Get learning days
    let learningDaysQuery = supabase
      .from('learning_days')
      .select('user_id, learning_date')

    if (startDate) {
      learningDaysQuery = learningDaysQuery.gte('learning_date', startDate.toISOString().split('T')[0])
    }

    const { data: learningDaysData } = await learningDaysQuery

    // Get skill progress for each student
    const { data: skillProgressData } = await supabase
      .from('skill_progress')
      .select('user_id, skill_area_id, mastery_level, activities_completed')

    // Get family adventures achieved
    const { count: adventuresAchieved } = await supabase
      .from('family_adventures')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'achieved')

    // Get skill areas stats
    const { data: skillAreas } = await supabase
      .from('skill_areas')
      .select('id, name, color')

    // Calculate stats per student
    const learningDaysByUser: Record<string, number> = {}
    const activeUsersThisWeek = new Set<string>()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    learningDaysData?.forEach(ld => {
      learningDaysByUser[ld.user_id] = (learningDaysByUser[ld.user_id] || 0) + 1
      if (new Date(ld.learning_date) >= weekAgo) {
        activeUsersThisWeek.add(ld.user_id)
      }
    })

    const skillProgressByUser: Record<string, { count: number; bestLevel: string | null }> = {}
    skillProgressData?.forEach(sp => {
      if (!skillProgressByUser[sp.user_id]) {
        skillProgressByUser[sp.user_id] = { count: 0, bestLevel: null }
      }
      skillProgressByUser[sp.user_id].count++
      // Track best mastery level
      const levels = ['exploring', 'growing', 'confident', 'teaching']
      const currentBest = skillProgressByUser[sp.user_id].bestLevel
      if (!currentBest || levels.indexOf(sp.mastery_level) > levels.indexOf(currentBest)) {
        skillProgressByUser[sp.user_id].bestLevel = sp.mastery_level
      }
    })

    // Calculate skill area stats
    const skillAreaStatsMap: Record<string, { total_activities: number; students: Set<string> }> = {}
    skillProgressData?.forEach(sp => {
      if (!skillAreaStatsMap[sp.skill_area_id]) {
        skillAreaStatsMap[sp.skill_area_id] = { total_activities: 0, students: new Set() }
      }
      skillAreaStatsMap[sp.skill_area_id].total_activities += sp.activities_completed || 0
      skillAreaStatsMap[sp.skill_area_id].students.add(sp.user_id)
    })

    const skillAreaStatsArray: SkillAreaStats[] = skillAreas?.map(sa => ({
      name: sa.name,
      color: sa.color,
      total_activities: skillAreaStatsMap[sa.id]?.total_activities || 0,
      students_count: skillAreaStatsMap[sa.id]?.students.size || 0,
    })) || []

    // Build student list with stats
    const studentStats: StudentStats[] = studentsData?.map(s => ({
      id: s.id,
      username: s.username,
      email: s.email,
      adventure_points: s.adventure_points || 0,
      learning_days_count: learningDaysByUser[s.id] || 0,
      skill_areas_count: skillProgressByUser[s.id]?.count || 0,
      mastery_level: skillProgressByUser[s.id]?.bestLevel || null,
      created_at: s.created_at,
    })) || []

    // Calculate totals
    const totalLearningDays = Object.values(learningDaysByUser).reduce((a, b) => a + b, 0)
    const totalAdventurePoints = studentsData?.reduce((sum, s) => sum + (s.adventure_points || 0), 0) || 0

    setStudents(studentStats)
    setCommunityStats({
      totalStudents: totalStudents || 0,
      totalLearningDays,
      totalAdventurePoints,
      totalAdventuresAchieved: adventuresAchieved || 0,
      activeThisWeek: activeUsersThisWeek.size,
      avgLearningDaysPerStudent: totalStudents ? Math.round(totalLearningDays / totalStudents) : 0,
    })
    setSkillAreaStats(skillAreaStatsArray)

    setLoading(false)
  }

  function getMasteryLabel(level: string | null) {
    switch (level) {
      case 'teaching': return 'Můžu učit'
      case 'confident': return 'Věřím si'
      case 'growing': return 'Rostu'
      case 'exploring': return 'Zkoumám'
      default: return 'Začíná'
    }
  }

  function getMasteryColor(level: string | null) {
    switch (level) {
      case 'teaching': return '#FFD700'
      case 'confident': return '#4AEDD9'
      case 'growing': return '#FF55FF'
      case 'exploring': return '#8B5CF6'
      default: return '#6B7280'
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
          <Users className="w-8 h-8 text-[var(--color-emerald)]" />
          Přehled komunity
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Statistiky učení a růstu studentů (Motivace 3.0)
        </p>
      </div>

      {/* Time Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'week', label: 'Tento týden' },
          { id: 'month', label: 'Tento měsíc' },
          { id: 'all', label: 'Celkově' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id as 'week' | 'month' | 'all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeFilter === filter.id
                ? 'bg-[var(--color-legendary)] text-white'
                : 'bg-[#0f0f1a] border border-[#2a2a4e] text-[var(--foreground-muted)] hover:border-[var(--color-legendary)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Community Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[var(--color-rare)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Studentů</span>
          </div>
          <p className="text-2xl font-bold text-white">{communityStats.totalStudents}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-[var(--color-emerald)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Dnů učení</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-emerald)]">{communityStats.totalLearningDays}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-[var(--foreground-muted)]">Rodinných bodů</span>
          </div>
          <p className="text-2xl font-bold text-pink-500">{communityStats.totalAdventurePoints}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-5 h-5 text-[var(--color-gold)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Dobrodružství</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-gold)]">{communityStats.totalAdventuresAchieved}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--foreground-muted)]">Aktivních (týden)</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{communityStats.activeThisWeek}</p>
        </div>
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-[var(--foreground-muted)]">Průměr dnů</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{communityStats.avgLearningDaysPerStudent}</p>
        </div>
      </div>

      {/* Skill Area Stats */}
      <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--color-gold)]" />
          Oblasti dovedností
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skillAreaStats.map((area) => (
            <div
              key={area.name}
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${area.color}15`, borderLeft: `4px solid ${area.color}` }}
            >
              <h3 className="font-bold mb-2" style={{ color: area.color }}>{area.name}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--foreground-muted)]">Aktivit celkem:</span>
                <span className="font-bold text-white">{area.total_activities}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[var(--foreground-muted)]">Studentů:</span>
                <span className="font-bold text-white">{area.students_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2a2a4e]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-emerald)]" />
            Přehled studentů
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4e]">
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Student</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Dnů učení</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Rodinné body</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Oblasti</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-[var(--foreground-muted)]">Úroveň</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-[#2a2a4e] hover:bg-[#1a1a2e]"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{student.username}</div>
                      <div className="text-sm text-[var(--foreground-muted)]">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4 text-[var(--color-emerald)]" />
                      <span className="font-bold text-[var(--color-emerald)]">{student.learning_days_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span className="font-bold text-pink-500">{student.adventure_points}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-white">{student.skill_areas_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className="px-2 py-1 rounded text-sm font-medium"
                      style={{
                        backgroundColor: `${getMasteryColor(student.mastery_level)}20`,
                        color: getMasteryColor(student.mastery_level)
                      }}
                    >
                      {getMasteryLabel(student.mastery_level)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="p-8 text-center text-[var(--foreground-muted)]">
            Žádní studenti k zobrazení
          </div>
        )}
      </div>

      {/* Motivation 3.0 Info */}
      <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl">
        <div className="flex items-start gap-4">
          <Trophy className="w-8 h-8 text-purple-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-white mb-2">Motivace 3.0 - Co měříme</h3>
            <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
              <li>• <strong className="text-white">Dny učení</strong> - konzistence bez trestu za vynechání</li>
              <li>• <strong className="text-white">Rodinné body</strong> - příspěvek ke sdíleným cílům</li>
              <li>• <strong className="text-white">Oblasti dovedností</strong> - rozmanitost učení</li>
              <li>• <strong className="text-white">Úroveň mistrovství</strong> - skutečný růst, ne čísla</li>
            </ul>
            <p className="text-sm text-purple-400 mt-3">
              Neporovnáváme studenty mezi sebou - sledujeme individuální růst každého.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
