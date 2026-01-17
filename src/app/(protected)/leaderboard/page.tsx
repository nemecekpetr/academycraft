'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Sparkles,
  Heart,
  Calendar,
  BookOpen,
  Trophy,
  Star,
  Compass,
  TrendingUp,
  MessageCircle
} from 'lucide-react'

interface CommunityStats {
  totalLearningDays: number
  totalActivities: number
  totalAdventuresAchieved: number
  activeLearnersThisWeek: number
}

interface RecentMilestone {
  id: string
  type: 'mastery' | 'rhythm' | 'adventure'
  message: string
  timestamp: string
}

interface AnonymousCelebration {
  id: string
  message: string
  icon: string
}

export default function CommunityPage() {
  const { theme } = useTheme()
  const [stats, setStats] = useState<CommunityStats>({
    totalLearningDays: 0,
    totalActivities: 0,
    totalAdventuresAchieved: 0,
    activeLearnersThisWeek: 0,
  })
  const [recentMilestones, setRecentMilestones] = useState<RecentMilestone[]>([])
  const [loading, setLoading] = useState(true)

  // Anonymous celebrations that rotate
  const celebrations: AnonymousCelebration[] = [
    { id: '1', message: 'Někdo právě dosáhl úrovně "Věřím si" v matematice!', icon: '🌟' },
    { id: '2', message: 'Rodina splnila své dobrodružství - společný výlet!', icon: '🎉' },
    { id: '3', message: 'Pět studentů se učilo každý den tento týden!', icon: '📚' },
    { id: '4', message: 'Někdo dokončil svůj první CERMAT test!', icon: '🏆' },
    { id: '5', message: 'Komunita má dnes přes 100 dokončených aktivit!', icon: '✨' },
  ]

  const [currentCelebration, setCurrentCelebration] = useState(0)

  useEffect(() => {
    loadCommunityData()

    // Rotate celebrations
    const interval = setInterval(() => {
      setCurrentCelebration((prev) => (prev + 1) % celebrations.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function loadCommunityData() {
    setLoading(true)
    const supabase = createClient()

    // Get total learning days (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: learningDaysCount } = await supabase
      .from('learning_days')
      .select('*', { count: 'exact', head: true })
      .gte('learning_date', thirtyDaysAgo.toISOString().split('T')[0])

    // Get total approved activities (last 30 days)
    const { count: activitiesCount } = await supabase
      .from('completed_activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('reviewed_at', thirtyDaysAgo.toISOString())

    // Get achieved adventures
    const { count: adventuresCount } = await supabase
      .from('family_adventures')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'achieved')

    // Get active learners this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: weeklyLearners } = await supabase
      .from('learning_days')
      .select('user_id')
      .gte('learning_date', weekAgo.toISOString().split('T')[0])

    const uniqueLearners = new Set(weeklyLearners?.map(l => l.user_id) || [])

    setStats({
      totalLearningDays: learningDaysCount || 0,
      totalActivities: activitiesCount || 0,
      totalAdventuresAchieved: adventuresCount || 0,
      activeLearnersThisWeek: uniqueLearners.size,
    })

    // Generate recent milestones (anonymized)
    const milestones: RecentMilestone[] = []

    // Check for recent mastery level ups
    const { data: recentMastery } = await supabase
      .from('skill_progress')
      .select('mastery_level, last_activity_at')
      .in('mastery_level', ['confident', 'teaching'])
      .gte('last_activity_at', thirtyDaysAgo.toISOString())
      .order('last_activity_at', { ascending: false })
      .limit(3)

    recentMastery?.forEach((m, i) => {
      milestones.push({
        id: `mastery-${i}`,
        type: 'mastery',
        message: m.mastery_level === 'teaching'
          ? 'Někdo dosáhl úrovně "Můžu učit"!'
          : 'Někdo se posunul na "Věřím si"!',
        timestamp: m.last_activity_at || new Date().toISOString(),
      })
    })

    // Check for recent rhythm milestones
    const { data: rhythmMilestones } = await supabase
      .from('profiles')
      .select('learning_rhythm_milestone')
      .not('learning_rhythm_milestone', 'is', null)
      .limit(5)

    rhythmMilestones?.forEach((r, i) => {
      if (r.learning_rhythm_milestone) {
        milestones.push({
          id: `rhythm-${i}`,
          type: 'rhythm',
          message: r.learning_rhythm_milestone === 'learning_is_life'
            ? 'Někdo má učení jako součást života!'
            : r.learning_rhythm_milestone === 'regular_student'
              ? 'Někdo se stal pravidelným studentem!'
              : 'Někdo našel svůj rytmus učení!',
          timestamp: new Date().toISOString(),
        })
      }
    })

    // Check for recent adventure achievements
    const { data: recentAdventures } = await supabase
      .from('family_adventures')
      .select('name, achieved_at')
      .eq('status', 'achieved')
      .order('achieved_at', { ascending: false })
      .limit(3)

    recentAdventures?.forEach((a, i) => {
      milestones.push({
        id: `adventure-${i}`,
        type: 'adventure',
        message: `Rodina dosáhla cíle: "${a.name}"!`,
        timestamp: a.achieved_at || new Date().toISOString(),
      })
    })

    // Sort by timestamp and take top 5
    milestones.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setRecentMilestones(milestones.slice(0, 5))

    setLoading(false)
  }

  const getMilestoneIcon = (type: RecentMilestone['type']) => {
    switch (type) {
      case 'mastery':
        return <Star className="w-5 h-5" />
      case 'rhythm':
        return <Calendar className="w-5 h-5" />
      case 'adventure':
        return <Compass className="w-5 h-5" />
    }
  }

  const getMilestoneColor = (type: RecentMilestone['type']) => {
    switch (type) {
      case 'mastery':
        return theme.colors.accent
      case 'rhythm':
        return theme.colors.primary
      case 'adventure':
        return theme.colors.xp
    }
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>
        <Users className="inline-block w-8 h-8 mr-2 mb-1" style={{ color: theme.colors.primary }} />
        Naše komunita
      </h1>
      <p className="mb-6" style={{ color: theme.colors.textMuted }}>
        Společně rosteme, společně se učíme
      </p>

      {/* Rotating Celebration Banner */}
      <div
        className="rounded-xl p-4 mb-6 overflow-hidden"
        style={{ backgroundColor: `${theme.colors.accent}20` }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCelebration}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-3xl">{celebrations[currentCelebration].icon}</span>
            <p className="font-medium" style={{ color: theme.colors.text }}>
              {celebrations[currentCelebration].message}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Community Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: theme.colors.card }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.primary }} />
          <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
            {stats.totalActivities}
          </p>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            aktivit tento měsíc
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: theme.colors.card }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.accent }} />
          <p className="text-3xl font-bold" style={{ color: theme.colors.accent }}>
            {stats.totalLearningDays}
          </p>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            dnů učení
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: theme.colors.card }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Heart className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.xp }} />
          <p className="text-3xl font-bold" style={{ color: theme.colors.xp }}>
            {stats.totalAdventuresAchieved}
          </p>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            rodinných dobrodružství
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: theme.colors.card }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: theme.colors.currency }} />
          <p className="text-3xl font-bold" style={{ color: theme.colors.currency }}>
            {stats.activeLearnersThisWeek}
          </p>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            aktivních tento týden
          </p>
        </motion.div>
      </div>

      {/* Recent Milestones */}
      <div
        className="rounded-xl p-4 mb-6"
        style={{ backgroundColor: theme.colors.card }}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Sparkles className="w-5 h-5" style={{ color: theme.colors.accent }} />
          Nedávné úspěchy komunity
        </h2>

        {recentMilestones.length === 0 ? (
          <p className="text-center py-4" style={{ color: theme.colors.textMuted }}>
            Buď první, kdo dosáhne milníku!
          </p>
        ) : (
          <div className="space-y-3">
            {recentMilestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: theme.colors.backgroundLight }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${getMilestoneColor(milestone.type)}20`, color: getMilestoneColor(milestone.type) }}
                >
                  {getMilestoneIcon(milestone.type)}
                </div>
                <p className="flex-1" style={{ color: theme.colors.text }}>
                  {milestone.message}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Encouragement */}
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: `${theme.colors.primary}10` }}
      >
        <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: theme.colors.primary }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: theme.colors.text }}>
          Každý krok se počítá
        </h3>
        <p style={{ color: theme.colors.textMuted }}>
          V naší komunitě nejde o soutěžení. Jde o to, abychom se společně zlepšovali
          a podporovali se na cestě k učení.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: theme.colors.primary }}>
          <MessageCircle className="w-4 h-4" />
          <span>Tvoje snaha inspiruje ostatní</span>
        </div>
      </div>
    </div>
  )
}
