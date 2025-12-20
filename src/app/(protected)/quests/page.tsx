import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuestList from './QuestList'

export default async function QuestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all active activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('is_active', true)
    .order('xp_reward', { ascending: false })

  // Get user's pending activities
  const { data: pendingActivities } = await supabase
    .from('completed_activities')
    .select(`
      *,
      activity:activities(name, icon)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false })

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-[var(--color-emerald)]" style={{ textShadow: '2px 2px 0 #000' }}>
        Quest Board
      </h1>
      <p className="text-[var(--foreground-muted)] mb-6">
        Vyber aktivitu, kterou jsi splnil/a
      </p>

      <QuestList
        activities={activities || []}
        pendingActivities={pendingActivities || []}
        userId={user.id}
      />
    </main>
  )
}
