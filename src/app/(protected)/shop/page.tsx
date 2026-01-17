import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopItems from './ShopItems'
import EmeraldCounter from '@/components/game/EmeraldCounter'

/**
 * Shop Page - Motivation 3.0 Note:
 * The shop with emerald currency represents an "if-then" reward system that can
 * undermine intrinsic motivation. Students are redirected to the dashboard.
 * Parents and admins can still view pending purchases.
 */
export default async function ShopPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile for emerald balance, XP, and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('emeralds, xp, role')
    .eq('id', user.id)
    .single()

  // Redirect students away from shop (Motivation 3.0)
  if (profile?.role === 'student') {
    redirect('/dashboard')
  }

  // Get all active shop items
  const { data: items } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  // Get user's pending purchases
  const { data: pendingPurchases } = await supabase
    .from('purchases')
    .select(`
      *,
      item:shop_items(name, icon, price)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('purchased_at', { ascending: false })

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-primary)]" style={{ textShadow: '2px 2px 0 #000' }}>
            Obchod
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Utrať své emeraldy za odměny
          </p>
        </div>
        <div className="mc-panel mc-panel-dark">
          <EmeraldCounter amount={profile?.emeralds || 0} size="lg" />
        </div>
      </div>

      <ShopItems
        items={items || []}
        pendingPurchases={pendingPurchases || []}
        userId={user.id}
        userEmeralds={profile?.emeralds || 0}
        userXp={profile?.xp || 0}
      />
    </main>
  )
}
