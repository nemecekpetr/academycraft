import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TimeCapsuleClient from './TimeCapsuleClient'
import type { TimeCapsule } from '@/types/database'

export default async function CapsulePage() {
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
    .select('role, username')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Only students can access this page
  if (profile.role !== 'student') {
    redirect('/parent')
  }

  // Get user's time capsule
  const { data: capsule } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Časová kapsle</h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Zpráva pro tvoje budoucí já
        </p>
      </div>

      <TimeCapsuleClient
        userId={user.id}
        initialCapsule={capsule as TimeCapsule | null}
      />
    </main>
  )
}
