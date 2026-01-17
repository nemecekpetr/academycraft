'use client'

import { motion } from 'framer-motion'
import { Star, TrendingUp, Award, Sparkles, BookOpen, Calendar } from 'lucide-react'
import type { SkillProgressWithArea, LearningDay, CompletedActivityWithDetails } from '@/types/database'
import { MASTERY_LEVELS } from '@/types/database'

interface GrowthStoryProps {
  skillProgress: SkillProgressWithArea[]
  learningDays: LearningDay[]
  recentActivities: CompletedActivityWithDetails[]
  weeklyGoalDays: number
  totalActivitiesCompleted: number
}

// Growth milestone messages based on activity count
const GROWTH_MILESTONES = [
  { threshold: 1, title: 'První krok!', message: 'Každá cesta začíná prvním krokem. Právě jsi ho udělala!' },
  { threshold: 5, title: 'Začínáš!', message: 'Už 5 aktivit za sebou. Vidíš, že to jde!' },
  { threshold: 10, title: 'Rosteš!', message: '10 aktivit! Tvůj mozek se učí nové věci.' },
  { threshold: 25, title: 'Skvělý pokrok!', message: '25 aktivit. To už je něco! Učení ti jde.' },
  { threshold: 50, title: 'Půlka cesty!', message: '50 aktivit! Dokázala jsi toho už tolik!' },
  { threshold: 100, title: 'Stovka!', message: '100 aktivit! Jsi na skvělé cestě.' },
  { threshold: 200, title: 'Mistryně!', message: '200 aktivit! Tvoje odhodlání je inspirující.' },
]

function getRecentMilestone(count: number) {
  let milestone = GROWTH_MILESTONES[0]
  for (const m of GROWTH_MILESTONES) {
    if (count >= m.threshold) {
      milestone = m
    }
  }
  return milestone
}

// Learning streak calculation
function calculateLearningStreak(learningDays: LearningDay[]): number {
  if (learningDays.length === 0) return 0

  const sortedDays = [...learningDays].sort(
    (a, b) => new Date(b.learning_date).getTime() - new Date(a.learning_date).getTime()
  )

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sortedDays.length; i++) {
    const dayDate = new Date(sortedDays[i].learning_date)
    dayDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - streak)

    if (dayDate.getTime() === expectedDate.getTime()) {
      streak++
    } else if (streak === 0 && i === 0) {
      // First day might be yesterday
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      if (dayDate.getTime() === yesterday.getTime()) {
        streak = 1
      } else {
        break
      }
    } else {
      break
    }
  }

  return streak
}

export default function GrowthStory({
  skillProgress,
  learningDays,
  recentActivities,
  weeklyGoalDays,
  totalActivitiesCompleted,
}: GrowthStoryProps) {
  const currentMilestone = getRecentMilestone(totalActivitiesCompleted)
  const learningStreak = calculateLearningStreak(learningDays)

  // Count activities this week
  const weekStart = new Date()
  const day = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1))
  weekStart.setHours(0, 0, 0, 0)

  const activitiesThisWeek = learningDays.filter(
    (d) => new Date(d.learning_date) >= weekStart
  ).reduce((sum, d) => sum + d.activities_count, 0)

  // Get top skill
  const topSkill = skillProgress.reduce((best, current) => {
    const masteryOrder = ['exploring', 'growing', 'confident', 'teaching']
    const currentLevel = masteryOrder.indexOf(current.mastery_level)
    const bestLevel = best ? masteryOrder.indexOf(best.mastery_level) : -1
    return currentLevel > bestLevel ? current : best
  }, skillProgress[0])

  return (
    <div className="space-y-4">
      {/* Current Milestone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mc-panel mc-panel-dark relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-400">{currentMilestone.title}</h3>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {currentMilestone.message}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mt-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {totalActivitiesCompleted} {totalActivitiesCompleted === 1 ? 'aktivita' : 'aktivit'} celkem
            </p>
          </div>
        </div>
      </motion.div>

      {/* This Week Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mc-panel mc-panel-dark"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-7 h-7 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Tento týden</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (activitiesThisWeek / weeklyGoalDays) * 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </div>
              <span className="text-sm text-blue-400 font-medium">
                {activitiesThisWeek}/{weeklyGoalDays}
              </span>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              {activitiesThisWeek >= weeklyGoalDays
                ? 'Splnila jsi svůj týdenní cíl!'
                : `Ještě ${weeklyGoalDays - activitiesThisWeek} ${weeklyGoalDays - activitiesThisWeek === 1 ? 'aktivita' : 'aktivity'} do cíle`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Learning Streak */}
      {learningStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mc-panel mc-panel-dark"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-orange-400">
                {learningStreak} {learningStreak === 1 ? 'den' : learningStreak < 5 ? 'dny' : 'dní'} v řadě!
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                {learningStreak >= 7
                  ? 'Úžasná pravidelnost! Učení je součástí tvého dne.'
                  : learningStreak >= 3
                  ? 'Buduje se ti krásný návyk!'
                  : 'Každý den se počítá. Pokračuj!'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Top Skill */}
      {topSkill && topSkill.skill_area && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mc-panel mc-panel-dark"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${topSkill.skill_area.color}20` }}
            >
              <Award className="w-7 h-7" style={{ color: topSkill.skill_area.color }} />
            </div>
            <div>
              <h3 className="font-bold" style={{ color: topSkill.skill_area.color }}>
                {topSkill.skill_area.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{MASTERY_LEVELS[topSkill.mastery_level].icon}</span>
                <span className="text-sm text-[var(--foreground-muted)]">
                  {MASTERY_LEVELS[topSkill.mastery_level].name}
                </span>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                {topSkill.activities_completed} aktivit v této oblasti
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Learning Moments */}
      {recentActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mc-panel mc-panel-dark"
        >
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Poslední úspěchy
          </h3>
          <div className="space-y-2">
            {recentActivities.slice(0, 3).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-2 bg-black/20 rounded"
              >
                <span className="text-xl">{activity.activity?.icon || '✓'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.activity?.name || 'Aktivita'}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {new Date(activity.reviewed_at || activity.submitted_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement when no data */}
      {totalActivitiesCompleted === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mc-panel mc-panel-dark text-center py-6"
        >
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <h3 className="font-bold mb-2">Tvůj příběh začíná!</h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Každá aktivita, kterou dokončíš, se stane součástí tvého příběhu růstu.
          </p>
        </motion.div>
      )}
    </div>
  )
}
