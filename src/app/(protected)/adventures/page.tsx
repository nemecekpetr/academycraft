import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdventureView from './AdventureView'
import type { FamilyAdventure, AdventureContribution, AdventureTemplate, Profile } from '@/types/database'

export default async function AdventuresPage() {
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

  // Check if parent role - redirect to parent dashboard
  if (profile.role === 'parent' || profile.role === 'admin') {
    redirect('/parent')
  }

  // Get family adventures (from parent)
  let adventures: FamilyAdventure[] = []
  let contributions: (AdventureContribution & { adventure?: FamilyAdventure })[] = []

  if (profile.parent_id) {
    // Get all family adventures
    const { data: familyAdventures } = await supabase
      .from('family_adventures')
      .select('*')
      .eq('family_id', profile.parent_id)
      .order('created_at', { ascending: false })

    adventures = familyAdventures || []

    // Get user's contributions
    const { data: userContributions } = await supabase
      .from('adventure_contributions')
      .select(`
        *,
        adventure:family_adventures(*)
      `)
      .eq('user_id', user.id)
      .order('contributed_at', { ascending: false })
      .limit(20)

    contributions = userContributions || []
  }

  // Get adventure templates for inspiration
  const { data: templates } = await supabase
    .from('adventure_templates')
    .select('*')
    .order('suggested_points', { ascending: true })

  // Separate active and achieved adventures
  const activeAdventure = adventures.find(a => a.status === 'active') || null
  const achievedAdventures = adventures.filter(a => a.status === 'achieved')

  // Calculate total user contribution
  const totalContribution = contributions.reduce((sum, c) => sum + c.points_contributed, 0)

  return (
    <main className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--theme-primary)]" style={{ textShadow: '2px 2px 0 #000' }}>
          Rodinná dobrodružství
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Společné cíle, společné zážitky
        </p>
      </div>

      <AdventureView
        activeAdventure={activeAdventure}
        achievedAdventures={achievedAdventures}
        contributions={contributions as (AdventureContribution & { adventure?: FamilyAdventure })[]}
        templates={(templates || []) as AdventureTemplate[]}
        userPoints={profile.adventure_points || 0}
        totalContribution={totalContribution}
        hasParent={!!profile.parent_id}
      />
    </main>
  )
}
