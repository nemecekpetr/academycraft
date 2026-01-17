import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'

  // Prevent open redirect - only allow relative paths that don't start with //
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', {
        message: error.message,
        status: error.status,
        code: error.code,
      })
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  console.error('OAuth callback called without code parameter')
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
