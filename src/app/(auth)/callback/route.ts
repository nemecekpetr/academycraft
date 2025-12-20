import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') // Get role from URL if present
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if this is a new user (profile might need role update)
      if (role && (role === 'student' || role === 'parent')) {
        // Check if profile exists and update role if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', data.user.id)
          .single()

        const profileData = profile as { id: string; role: string } | null
        if (profileData && profileData.role === 'student' && role === 'parent') {
          // Update role to parent if user registered as parent
          await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', data.user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
