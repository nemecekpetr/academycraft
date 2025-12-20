'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { THEMES, ThemeId, getLevelFromXpWithTheme, getLevelProgressWithTheme, getXpToNextLevelWithTheme } from '@/lib/themes'
import {
  User,
  Star,
  Gem,
  Trophy,
  Flame,
  Calendar,
  TrendingUp,
  Award,
  Palette,
  Check,
  Loader2
} from 'lucide-react'

interface Profile {
  username: string
  email: string
  xp: number
  emeralds: number
  current_streak: number
  longest_streak: number
  theme: string | null
  created_at: string
}

interface Stats {
  totalActivities: number
  totalPurchases: number
}

export default function ProfilePage() {
  const { theme, themeId, setThemeId } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalActivities: 0, totalPurchases: 0 })
  const [loading, setLoading] = useState(true)
  const [savingTheme, setSavingTheme] = useState(false)

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
      setProfile(profileData)
    }

    // Get stats
    const { count: activitiesCount } = await supabase
      .from('completed_activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved')

    const { count: purchasesCount } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setStats({
      totalActivities: activitiesCount || 0,
      totalPurchases: purchasesCount || 0
    })

    setLoading(false)
  }

  async function handleThemeChange(newThemeId: ThemeId) {
    if (newThemeId === themeId) return

    setSavingTheme(true)
    await setThemeId(newThemeId)
    setSavingTheme(false)
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

  const level = getLevelFromXpWithTheme(profile.xp, themeId)
  const progress = getLevelProgressWithTheme(profile.xp, themeId)
  const xpToNext = getXpToNextLevelWithTheme(profile.xp, themeId)
  const nextLevel = theme.levels.find(l => l.level === level.level + 1)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6" style={{ color: theme.colors.text }}>Můj profil</h1>

      {/* Profile Card */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${level.color}20` }}
          >
            {level.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{profile.username}</h2>
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-bold mt-1"
              style={{ backgroundColor: `${level.color}20`, color: level.color }}
            >
              Lv.{level.level} {level.name}
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-bold flex items-center gap-1" style={{ color: theme.colors.xp }}>
              <Star className="w-4 h-4" />
              {profile.xp} XP
            </span>
            {nextLevel && (
              <span style={{ color: theme.colors.textMuted }}>
                {xpToNext} XP do {nextLevel.icon} {nextLevel.name}
              </span>
            )}
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: level.color
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <Gem className="w-6 h-6 mx-auto mb-2" style={{ color: theme.colors.currency }} />
            <div className="text-2xl font-bold" style={{ color: theme.colors.currency }}>{profile.emeralds}</div>
            <div className="text-sm" style={{ color: theme.colors.textMuted }}>{theme.colors.currencyName}</div>
          </div>
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: theme.colors.backgroundLight }}>
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-500">{profile.current_streak}</div>
            <div className="text-sm" style={{ color: theme.colors.textMuted }}>Dnů v řadě</div>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Palette className="w-5 h-5" style={{ color: theme.colors.primary }} />
          Vzhled aplikace
          {savingTheme && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(Object.values(THEMES) as typeof THEMES[ThemeId][]).map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              disabled={savingTheme}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                themeId === t.id
                  ? 'border-white scale-105'
                  : 'border-transparent hover:border-gray-600'
              }`}
              style={{
                backgroundColor: t.colors.card,
              }}
            >
              {themeId === t.id && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.colors.primary }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-bold text-sm" style={{ color: t.colors.primary }}>
                {t.name}
              </div>
              <div className="text-xs mt-1" style={{ color: t.colors.textMuted }}>
                {t.description}
              </div>
              {/* Preview of levels */}
              <div className="flex justify-center gap-1 mt-2">
                {t.levels.slice(0, 3).map((lvl) => (
                  <span key={lvl.level} className="text-sm">{lvl.icon}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Trophy className="w-5 h-5" style={{ color: theme.colors.accent }} />
          Statistiky
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: theme.colors.text }}>{stats.totalActivities}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Splněných úkolů</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: theme.colors.text }}>{stats.totalPurchases}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Nákupů</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: theme.colors.text }}>{profile.longest_streak}</div>
            <div className="text-xs" style={{ color: theme.colors.textMuted }}>Nejdelší série</div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div
        className="border-2 rounded-xl p-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <TrendingUp className="w-5 h-5" style={{ color: theme.colors.xp }} />
          Levelová cesta
        </h3>
        <div className="space-y-3">
          {theme.levels.map((lvl) => {
            const isUnlocked = profile.xp >= lvl.minXp
            const isCurrent = lvl.level === level.level

            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isCurrent
                    ? 'border-2'
                    : isUnlocked
                      ? 'opacity-80'
                      : 'opacity-40'
                }`}
                style={{
                  backgroundColor: isCurrent ? theme.colors.backgroundLight : 'transparent',
                  borderColor: isCurrent ? lvl.color : 'transparent'
                }}
              >
                <span className="text-2xl">{lvl.icon}</span>
                <div className="flex-1">
                  <div className="font-bold" style={{ color: isUnlocked ? lvl.color : undefined }}>
                    Lv.{lvl.level} {lvl.name}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                    {lvl.minXp} XP
                  </div>
                </div>
                {isUnlocked && (
                  <Award className="w-5 h-5" style={{ color: lvl.color }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
