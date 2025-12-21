import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ParentDashboard from './ParentDashboard'

export default async function ParentPage() {
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
    redirect('/login')
  }

  // Only allow parents and admins
  if (profile.role !== 'parent' && profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get children (users with this parent_id)
  const { data: children } = await supabase
    .from('profiles')
    .select('id, username, email, xp, emeralds, current_streak')
    .eq('parent_id', user.id)

  // Get pending activities for all children
  const childIds = children?.map(c => c.id) || []

  let pendingActivities: Array<{
    id: string
    user_id: string
    activity_id: string
    score: number | null
    notes: string | null
    submitted_at: string
    user: { username: string } | null
    activity: {
      name: string
      xp_reward: number
      emerald_reward: number
      flawless_threshold: number | null
      max_score: number | null
    } | null
  }> = []

  if (childIds.length > 0) {
    const { data } = await supabase
      .from('completed_activities')
      .select(`
        id,
        user_id,
        activity_id,
        score,
        notes,
        submitted_at,
        user:profiles(username),
        activity:activities(name, xp_reward, emerald_reward, flawless_threshold, max_score)
      `)
      .in('user_id', childIds)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })

    if (data) {
      pendingActivities = data as unknown as typeof pendingActivities
    }
  }

  // Get pending purchases for all children
  let pendingPurchases: Array<{
    id: string
    user_id: string
    purchased_at: string
    user: { username: string } | null
    item: { name: string; price: number } | null
  }> = []

  if (childIds.length > 0) {
    const { data } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        purchased_at,
        user:profiles(username),
        item:shop_items(name, price)
      `)
      .in('user_id', childIds)
      .eq('status', 'pending')
      .order('purchased_at', { ascending: true })

    if (data) {
      pendingPurchases = data as unknown as typeof pendingPurchases
    }
  }

  return (
    <ParentDashboard
      profile={profile}
      children={children || []}
      pendingActivities={pendingActivities}
      pendingPurchases={pendingPurchases}
    />
  )
}
