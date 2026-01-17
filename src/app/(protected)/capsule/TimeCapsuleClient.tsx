'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TimeCapsule from '@/components/game/TimeCapsule'
import type { TimeCapsule as TimeCapsuleType } from '@/types/database'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface TimeCapsuleClientProps {
  userId: string
  initialCapsule: TimeCapsuleType | null
}

export default function TimeCapsuleClient({ userId, initialCapsule }: TimeCapsuleClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleCreateCapsule = async (data: {
    message: string
    goals: string | null
    fears: string | null
    excitement: string | null
    unlock_date: string
  }) => {
    const { error } = await supabase
      .from('time_capsules')
      .insert({
        user_id: userId,
        message: data.message,
        goals: data.goals,
        fears: data.fears,
        excitement: data.excitement,
        unlock_date: data.unlock_date,
        is_locked: true,
      })

    if (error) {
      console.error('Error creating capsule:', error)
      return
    }

    router.refresh()
  }

  const handleUnlockCapsule = async () => {
    if (!initialCapsule) return

    const { error } = await supabase
      .from('time_capsules')
      .update({
        is_locked: false,
        unlocked_at: new Date().toISOString(),
      })
      .eq('id', initialCapsule.id)

    if (error) {
      console.error('Error unlocking capsule:', error)
      return
    }

    router.refresh()
  }

  const handleAddReflection = async (reflection: string) => {
    if (!initialCapsule) return

    const { error } = await supabase
      .from('time_capsules')
      .update({ reflection })
      .eq('id', initialCapsule.id)

    if (error) {
      console.error('Error adding reflection:', error)
      return
    }

    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zpět na hlavní stránku
      </Link>

      <TimeCapsule
        capsule={initialCapsule}
        onCreateCapsule={handleCreateCapsule}
        onUnlockCapsule={handleUnlockCapsule}
        onAddReflection={handleAddReflection}
      />

      {!initialCapsule && (
        <div className="mc-panel mc-panel-dark mt-6">
          <h3 className="font-bold mb-2">Proč časová kapsle?</h3>
          <ul className="text-sm text-[var(--foreground-muted)] space-y-2">
            <li>• Uvidíš, jak moc jsi vyrostla</li>
            <li>• Připomeneš si svoje sny a cíle</li>
            <li>• Oceníš cestu, kterou jsi ušla</li>
            <li>• Bude to překvapení od sebe samé!</li>
          </ul>
        </div>
      )}
    </div>
  )
}
