import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GrowthStory from '@/components/game/GrowthStory'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { SkillProgressWithArea, LearningDay, CompletedActivityWithDetails } from '@/types/database'

// Helper to get date 4 weeks ago
function getFourWeeksAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 28)
  date.setHours(0, 0, 0, 0)
  return date
}

export default async function StoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username, weekly_goal_days')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Only students can access this page
  if (profile.role !== 'student') {
    redirect('/parent')
  }

  // Get skill progress with skill areas
  const { data: skillProgress } = await supabase
    .from('skill_progress')
    .select(`
      *,
      skill_area:skill_areas(*)
    `)
    .eq('user_id', user.id)

  // Get learning days for the past 4 weeks
  const fourWeeksAgo = getFourWeeksAgo()
  const { data: learningDays } = await supabase
    .from('learning_days')
    .select('*')
    .eq('user_id', user.id)
    .gte('learning_date', fourWeeksAgo.toISOString().split('T')[0])
    .order('learning_date', { ascending: false })

  // Get recent completed activities
  const { data: recentActivities } = await supabase
    .from('completed_activities')
    .select(`
      *,
      activity:activities(name, icon, purpose_message, skill_area:skill_areas(*))
    `)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(5)

  // Get total activities count
  const { count: totalActivities } = await supabase
    .from('completed_activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'approved')

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </Link>
        <h1 className="text-2xl font-bold">Příběh růstu</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Tvoje cesta za poznáním, {profile.username}
        </p>
      </div>

      <GrowthStory
        skillProgress={(skillProgress || []) as SkillProgressWithArea[]}
        learningDays={(learningDays || []) as LearningDay[]}
        recentActivities={(recentActivities || []) as CompletedActivityWithDetails[]}
        weeklyGoalDays={profile.weekly_goal_days || 3}
        totalActivitiesCompleted={totalActivities || 0}
      />
    </main>
  )
}
