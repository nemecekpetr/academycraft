import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, username, fullName, role } = body

    if (!email || !password || !username || !role) {
      return NextResponse.json(
        { error: 'Chybí povinné údaje (email, heslo, přezdívka, role)' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Heslo musí mít alespoň 8 znaků' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Create user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username,
        full_name: fullName || null,
        role,
        theme: 'minecraft',
      },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Uživatel s tímto emailem již existuje' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Also create profile in profiles table (trigger might not fire for admin.createUser)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        username,
        full_name: fullName || null,
        role,
        theme: 'minecraft',
        xp: 0,
        emeralds: 0,
        current_streak: 0,
        longest_streak: 0,
        is_banned: false,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // User was created in auth but profile failed - try to clean up
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Nepodařilo se vytvořit profil uživatele' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit uživatele' },
      { status: 500 }
    )
  }
}
