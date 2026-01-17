'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import SkillConstellation from '@/components/game/SkillConstellation'
import LearningWeek from '@/components/game/LearningWeek'
import {
  Star,
  Trophy,
  TrendingUp,
  ScrollText,
  Sparkles,
  BookOpen,
  FileText,
  GraduationCap,
  PenTool,
  Calculator,
  Beaker,
  Globe,
  Music,
  Palette,
  Dumbbell,
  Home,
  Users,
  Heart,
  Calendar,
  type LucideProps
} from 'lucide-react'
import type { SkillProgressWithArea, LearningDay, RhythmMilestone } from '@/types/database'

interface Profile {
  username: string
  email: string
  xp: number
  emeralds: number
  adventure_points: number
  current_streak: number
  longest_streak: number
  theme: string | null
  created_at: string
  weekly_goal_days: number
  learning_rhythm_milestone: RhythmMilestone
}

interface Stats {
  totalActivities: number
  totalContributions: number
  achievedAdventures: number
}

interface CompletedActivity {
  id: string
  submitted_at: string
  status: 'approved' | 'rejected' | 'pending'
  score: number | null
  activity: {
    name: string
    icon: string
    max_score: number | null
    purpose_message: string | null
    skill_area: {
      name: string
      color: string
    } | null
  } | null
}

// Map icon names to Lucide components
const activityIconMap: Record<string, React.ComponentType<LucideProps>> = {
  'book': BookOpen,
  'book-open': BookOpen,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'pen-tool': PenTool,
  'calculator': Calculator,
  'beaker': Beaker,
  'globe': Globe,
  'music': Music,
  'palette': Palette,
  'dumbbell': Dumbbell,
  'home': Home,
  'users': Users,
  'star': Star,
  'trophy': Trophy,
  'scroll': ScrollText,
  'brain': Beaker,
  'bug': PenTool,
}

export default function ProfilePage() {
  const { theme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalActivities: 0, totalContributions: 0, achievedAdventures: 0 })
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([])
  const [skillProgress, setSkillProgress] = useState<SkillProgressWithArea[]>([])
  const [learningDays, setLearningDays] = useState<LearningDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData as Profile)
    }

    // Get stats
    const { count: activitiesCount } = await supabase
      .from('completed_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved')

    // Get adventure contributions count
    const { data: contributions } = await supabase
      .from('adventure_contributions')
      .select('points_contributed')
      .eq('user_id', user.id)

    const totalContributions = contributions?.reduce((sum, c) => sum + c.points_contributed, 0) || 0

    // Get achieved adventures count (via parent)
    let achievedAdventures = 0
    if (profileData?.parent_id) {
      const { count } = await supabase
        .from('family_adventures')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', profileData.parent_id)
        .eq('status', 'achieved')
      achievedAdventures = count || 0
    }

    setStats({
      totalActivities: activitiesCount || 0,
      totalContributions,
      achievedAdventures
    })

    // Get skill progress
    const { data: skillData } = await supabase
      .from('skill_progress')
      .select(`
        *,
        skill_area:skill_areas(*)
      `)
      .eq('user_id', user.id)

    if (skillData) {
      setSkillProgress(skillData as SkillProgressWithArea[])
    }

    // Get learning days (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const { data: learningData } = await supabase
      .from('learning_days')
      .select('*')
      .eq('user_id', user.id)
      .gte('learning_date', fourWeeksAgo.toISOString().split('T')[0])
      .order('learning_date', { ascending: false })

    if (learningData) {
      setLearningDays(learningData as LearningDay[])
    }

    // Get completed activities history
    const { data: activitiesData } = await supabase
      .from('completed_activities')
      .select(`
        id,
        submitted_at,
        status,
        score,
        activity:activities(name, icon, max_score, purpose_message, skill_area:skill_areas(name, color))
      `)
      .eq('user_id', user.id)
      .in('status', ['approved', 'rejected'])
      .order('submitted_at', { ascending: false })
      .limit(15)

    if (activitiesData) {
      setCompletedActivities(activitiesData as unknown as CompletedActivity[])
    }

    setLoading(false)
  }

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

  if (!profile) {
    return (
      <div className="text-center py-12 text-[var(--foreground-muted)]">
        Profil nenalezen
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6" style={{ color: theme.colors.text }}>Můj profil</h1>

      {/* Profile Card */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${theme.colors.primary}20` }}
          >
            <Star className="w-10 h-10" style={{ color: theme.colors.primary }} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{profile.username}</h2>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              Na cestě od {new Date(profile.created_at).toLocaleDateString('cs-CZ')}
            </p>
          </div>
        </div>

        {/* Stats Grid - Motivation 3.0 focused */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.primary }} />
            <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>{profile.adventure_points || 0}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Rodinné body</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.accent }} />
            <div className="text-2xl font-bold" style={{ color: theme.colors.accent }}>{stats.achievedAdventures}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Dobrodružství</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <Calendar className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.xp }} />
            <div className="text-2xl font-bold" style={{ color: theme.colors.xp }}>{learningDays.length}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Dnů učení</div>
          </div>
        </div>
      </div>

      {/* Skill Constellations - Mastery */}
      <div className="mb-6">
        <SkillConstellation
          skillProgress={skillProgress}
          showDetails={true}
          size="md"
        />
      </div>

      {/* Learning Rhythm */}
      <div className="mb-6">
        <LearningWeek
          learningDays={learningDays}
          weeklyGoalDays={profile.weekly_goal_days || 3}
          rhythmMilestone={profile.learning_rhythm_milestone}
          weeksToShow={4}
        />
      </div>

      {/* Achievements */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <TrendingUp className="w-5 h-5" style={{ color: theme.colors.xp }} />
          Cesta růstu
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-black/10 rounded-lg">
            <div className="text-xl font-bold" style={{ color: theme.colors.text }}>{stats.totalActivities}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Splněných aktivit</div>
          </div>
          <div className="text-center p-3 bg-black/10 rounded-lg">
            <div className="text-xl font-bold" style={{ color: theme.colors.text }}>{stats.totalContributions}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Příspěvek rodině</div>
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div
        className="border-2 rounded-xl p-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <ScrollText className="w-5 h-5" style={{ color: theme.colors.primary }} />
          Historie učení
        </h3>
        {completedActivities.length === 0 ? (
          <div className="text-center py-6" style={{ color: theme.colors.textMuted }}>
            Tvoje cesta teprve začíná!
          </div>
        ) : (
          <div className="space-y-3">
            {completedActivities.map((item) => {
              const activity = Array.isArray(item.activity) ? item.activity[0] : item.activity
              const isApproved = item.status === 'approved'
              const IconComponent = activityIconMap[activity?.icon || ''] || BookOpen
              const skillArea = activity?.skill_area

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: theme.colors.backgroundLight }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isApproved
                        ? `${skillArea?.color || theme.colors.primary}20`
                        : 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: isApproved ? (skillArea?.color || theme.colors.primary) : '#ef4444' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: theme.colors.text }}>
                      {activity?.name || 'Neznámá aktivita'}
                    </div>
                    <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                      {new Date(item.submitted_at).toLocaleDateString('cs-CZ')}
                      {item.score !== null && activity?.max_score && (
                        <span className="ml-2">• Skóre: {item.score}/{activity.max_score}</span>
                      )}
                    </div>
                  </div>
                  {isApproved ? (
                    <div className="flex items-center gap-2">
                      {skillArea && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${skillArea.color}20`,
                            color: skillArea.color
                          }}
                        >
                          {skillArea.name}
                        </span>
                      )}
                      <Sparkles className="w-4 h-4" style={{ color: theme.colors.accent }} />
                    </div>
                  ) : (
                    <div
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                    >
                      Zamítnuto
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
