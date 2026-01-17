import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FamilyAdventure from '@/components/game/FamilyAdventure'
import LearningWeek from '@/components/game/LearningWeek'
import SkillConstellation from '@/components/game/SkillConstellation'
import { RecognitionList } from '@/components/game/RecognitionCard'
import RhythmGolem from '@/components/game/RhythmGolem'
import MotivationalQuote from '@/components/game/MotivationalQuote'
import Link from 'next/link'
import { Scroll, Compass, CheckCircle, MessageCircle, Lock, Sparkles, BookOpen } from 'lucide-react'
import type { LearningDay, SkillProgressWithArea, FamilyAdventure as FamilyAdventureType, Recognition, RhythmMilestone, TimeCapsule } from '@/types/database'

// Helper to get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Helper to get date 4 weeks ago
function getFourWeeksAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 28)
  date.setHours(0, 0, 0, 0)
  return date
}

export default async function DashboardPage() {
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
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <main className="p-4 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Profil nenalezen</h1>
        <p className="text-[var(--foreground-muted)] mb-4">
          Tvůj profil nebyl nalezen. Zkus se odhlásit a znovu přihlásit.
        </p>
        <a href="/login" className="mc-button mc-button-primary">
          Přejít na přihlášení
        </a>
      </main>
    )
  }

  // Check if parent role - redirect to parent dashboard
  if (profile.role === 'parent' || profile.role === 'admin') {
    redirect('/parent')
  }

  // Get learning days for the past 4 weeks
  const fourWeeksAgo = getFourWeeksAgo()
  const { data: learningDays } = await supabase
    .from('learning_days')
    .select('*')
    .eq('user_id', user.id)
    .gte('learning_date', fourWeeksAgo.toISOString().split('T')[0])
    .order('learning_date', { ascending: false })

  // Get skill progress with skill areas
  const { data: skillProgress } = await supabase
    .from('skill_progress')
    .select(`
      *,
      skill_area:skill_areas(*)
    `)
    .eq('user_id', user.id)

  // Get active family adventure (from parent)
  let activeAdventure: FamilyAdventureType | null = null
  let userContribution = 0

  if (profile.parent_id) {
    const { data: adventures } = await supabase
      .from('family_adventures')
      .select('*')
      .eq('family_id', profile.parent_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (adventures && adventures.length > 0) {
      const adventure = adventures[0]
      activeAdventure = adventure

      // Get user's contribution to this adventure
      const { data: contributions } = await supabase
        .from('adventure_contributions')
        .select('points_contributed')
        .eq('adventure_id', adventure.id)
        .eq('user_id', user.id)

      userContribution = contributions?.reduce((sum, c) => sum + c.points_contributed, 0) || 0
    }
  }

  // Get unread recognitions
  const { data: recognitions } = await supabase
    .from('recognitions')
    .select('*')
    .eq('user_id', user.id)
    .is('viewed_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get pending activities count
  const { count: pendingCount } = await supabase
    .from('completed_activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Get recent completed activities (for celebration section)
  const { data: recentActivities } = await supabase
    .from('completed_activities')
    .select(`
      *,
      activity:activities(name, icon, purpose_message, skill_area:skill_areas(*))
    `)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(3)

  // Get time capsule
  const { data: timeCapsule } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Mark recognitions as viewed (async, don't wait)
  if (recognitions && recognitions.length > 0) {
    supabase
      .from('recognitions')
      .update({ viewed_at: new Date().toISOString() })
      .in('id', recognitions.map(r => r.id))
      .then(() => {})
  }

  // Calculate learning streak and activities this week for Golem
  const weekStart = getWeekStart()
  const learningDaysThisWeek = (learningDays || []).filter(
    (d) => new Date(d.learning_date) >= weekStart
  )
  const activitiesThisWeek = learningDaysThisWeek.reduce((sum, d) => sum + d.activities_count, 0)

  // Calculate simple streak (consecutive days)
  let learningStreak = 0
  if (learningDays && learningDays.length > 0) {
    const sortedDays = [...learningDays].sort(
      (a, b) => new Date(b.learning_date).getTime() - new Date(a.learning_date).getTime()
    )
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedDays.length; i++) {
      const dayDate = new Date(sortedDays[i].learning_date)
      dayDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - learningStreak)

      if (dayDate.getTime() === expectedDate.getTime()) {
        learningStreak++
      } else if (learningStreak === 0) {
        // First day might be yesterday
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        if (dayDate.getTime() === yesterday.getTime()) {
          learningStreak = 1
        } else {
          break
        }
      } else {
        break
      }
    }
  }

  const lastActivityDate = learningDays && learningDays.length > 0
    ? learningDays[0].learning_date
    : null

  return (
    <main className="p-4 max-w-lg mx-auto">
      {/* Header - Simple greeting */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Ahoj, {profile.username}!</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          {new Date().toLocaleDateString('cs-CZ', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Motivational Quote */}
      <div className="mb-6">
        <MotivationalQuote />
      </div>

      {/* Rhythm Golem - Friendly mascot */}
      <div className="mb-6">
        <RhythmGolem
          learningStreak={learningStreak}
          activitiesThisWeek={activitiesThisWeek}
          weeklyGoal={profile.weekly_goal_days || 3}
          lastActivityDate={lastActivityDate}
          username={profile.username}
        />
      </div>

      {/* Recognitions (Now-That) - Show first if any */}
      {recognitions && recognitions.length > 0 && (
        <div className="mb-6">
          <RecognitionList recognitions={recognitions as Recognition[]} maxVisible={2} />
        </div>
      )}

      {/* Family Adventure - Shared Goal */}
      <div className="mb-6">
        <FamilyAdventure
          adventure={activeAdventure}
          userPoints={userContribution}
          size="md"
        />
      </div>

      {/* Learning Rhythm - No punishment calendar */}
      <div className="mb-6">
        <LearningWeek
          learningDays={(learningDays || []) as LearningDay[]}
          weeklyGoalDays={profile.weekly_goal_days || 3}
          rhythmMilestone={profile.learning_rhythm_milestone as RhythmMilestone}
          weeksToShow={4}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/quests">
          <button className="mc-button mc-button-primary w-full py-4 flex flex-col items-center gap-2">
            <Scroll className="w-8 h-8" />
            <span>Nový Quest</span>
          </button>
        </Link>
        <Link href="/adventures">
          <button className="mc-button w-full py-4 flex flex-col items-center gap-2">
            <Compass className="w-8 h-8" />
            <span>Dobrodružství</span>
          </button>
        </Link>
      </div>

      {/* Special Features */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Time Capsule Teaser */}
        <Link href="/capsule">
          <div className="mc-panel mc-panel-dark h-full hover:border-purple-500/50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                {timeCapsule ? (
                  timeCapsule.is_locked ? (
                    <Lock className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  )
                ) : (
                  <Lock className="w-6 h-6 text-purple-400" />
                )}
              </div>
              <h3 className="font-bold text-purple-400 text-sm">Časová kapsle</h3>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {timeCapsule ? (
                  timeCapsule.is_locked ? 'Zamčená' : 'Otevřená!'
                ) : (
                  'Vytvoř'
                )}
              </p>
            </div>
          </div>
        </Link>

        {/* Growth Story Teaser */}
        <Link href="/story">
          <div className="mc-panel mc-panel-dark h-full hover:border-yellow-500/50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-bold text-yellow-400 text-sm">Příběh růstu</h3>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Tvoje cesta
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Skill Constellation - Mastery visualization */}
      {skillProgress && skillProgress.length > 0 && (
        <div className="mb-6">
          <SkillConstellation
            skillProgress={skillProgress as SkillProgressWithArea[]}
            showDetails={true}
            size="md"
          />
        </div>
      )}

      {/* Pending Items */}
      {pendingCount && pendingCount > 0 && (
        <div className="mc-panel mc-panel-dark mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[var(--theme-accent)]" />
            Čeká na rodiče
          </h2>
          <div className="flex items-center justify-between p-2 bg-black/20 rounded">
            <span>{pendingCount} {pendingCount === 1 ? 'aktivita' : 'aktivity'}</span>
            <span className="text-[var(--theme-accent)] text-sm">čeká na schválení</span>
          </div>
        </div>
      )}

      {/* Recent Learning Moments */}
      <div className="mc-panel mc-panel-dark">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[var(--theme-primary)]" />
          Poslední kroky na cestě
        </h2>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-black/20 rounded"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{item.activity?.name}</span>
                  {item.activity?.skill_area && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.activity.skill_area.color}20`,
                        color: item.activity.skill_area.color,
                      }}
                    >
                      {item.activity.skill_area.name}
                    </span>
                  )}
                </div>
                {item.activity?.purpose_message && (
                  <p className="text-xs text-[var(--foreground-muted)] italic">
                    {item.activity.purpose_message}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--foreground-muted)] py-4">
            Tvoje cesta teprve začíná! Každý malý krok se počítá.
          </p>
        )}
      </div>
    </main>
  )
}
