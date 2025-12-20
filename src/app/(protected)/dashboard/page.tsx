import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateLevel, getLevelInfo } from '@/lib/constants'
import XpBar from '@/components/game/XpBar'
import EmeraldCounter from '@/components/game/EmeraldCounter'
import StreakBadge from '@/components/game/StreakBadge'
import Link from 'next/link'
import { Scroll, Clock, CheckCircle, Gift } from 'lucide-react'

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
    // Profile doesn't exist - user needs to complete setup
    // Don't redirect to prevent loops, show message instead
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

  // Get pending activities count
  const { count: pendingCount } = await supabase
    .from('completed_activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Get recent completed activities
  const { data: recentActivities } = await supabase
    .from('completed_activities')
    .select(`
      *,
      activity:activities(name, icon)
    `)
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(5)

  // Get pending purchases count
  const { count: pendingPurchases } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  const level = calculateLevel(profile.xp)
  const levelInfo = getLevelInfo(level)

  // Check if parent role - redirect to parent dashboard
  if (profile.role === 'parent' || profile.role === 'admin') {
    redirect('/parent')
  }

  return (
    <main className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ahoj, {profile.username}!</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {new Date().toLocaleDateString('cs-CZ', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <StreakBadge streak={profile.current_streak} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="mc-panel mc-panel-dark">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">Emeraldy</p>
          <EmeraldCounter amount={profile.emeralds} size="lg" />
        </div>
        <div className="mc-panel mc-panel-dark">
          <p className="text-xs text-[var(--foreground-muted)] mb-1">Level</p>
          <p
            className="text-2xl font-bold"
            style={{ color: levelInfo.color, textShadow: `0 0 10px ${levelInfo.color}` }}
          >
            {level}
          </p>
          <p className="text-xs" style={{ color: levelInfo.color }}>
            {levelInfo.title}
          </p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="mc-panel mc-panel-dark mb-6">
        <XpBar xp={profile.xp} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/quests">
          <button className="mc-button mc-button-primary w-full py-4 flex flex-col items-center gap-2">
            <Scroll className="w-8 h-8" />
            <span>Nový Quest</span>
          </button>
        </Link>
        <Link href="/shop">
          <button className="mc-button w-full py-4 flex flex-col items-center gap-2">
            <Gift className="w-8 h-8" />
            <span>Obchod</span>
          </button>
        </Link>
      </div>

      {/* Pending Items */}
      {((pendingCount && pendingCount > 0) || (pendingPurchases && pendingPurchases > 0)) && (
        <div className="mc-panel mc-panel-dark mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-gold)]" />
            Čeká na schválení
          </h2>
          <div className="space-y-2">
            {pendingCount && pendingCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                <span>{pendingCount} {pendingCount === 1 ? 'aktivita' : 'aktivity'}</span>
                <span className="text-[var(--color-gold)] text-sm">čeká</span>
              </div>
            )}
            {pendingPurchases && pendingPurchases > 0 && (
              <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                <span>{pendingPurchases} {pendingPurchases === 1 ? 'nákup' : 'nákupy'}</span>
                <span className="text-[var(--color-gold)] text-sm">čeká</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mc-panel mc-panel-dark">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[var(--color-emerald)]" />
          Poslední úspěchy
        </h2>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="space-y-2">
            {recentActivities.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-black/20 rounded"
              >
                <div className="flex items-center gap-2">
                  <span>{item.activity?.name}</span>
                  {item.is_flawless && (
                    <span className="text-xs bg-[var(--color-gold)] text-black px-1 rounded">
                      FLAWLESS
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--color-xp-green)]">+{item.xp_earned} XP</span>
                  <span className="text-[var(--color-emerald)]">+{item.emeralds_earned}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--foreground-muted)] py-4">
            Zatím žádné splněné questy. Začni plnit úkoly!
          </p>
        )}
      </div>
    </main>
  )
}
