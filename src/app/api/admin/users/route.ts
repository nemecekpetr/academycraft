import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/lib/supabase/admin'

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
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
      email_confirm: true,
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

    // Create profile in profiles table
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
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Nepodařilo se vytvořit uživatele' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const adminUserId = await requireAdmin()
    const body = await request.json()
    const { userId, username, full_name, role, parent_id, xp, emeralds, is_banned } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent self-ban or self-role-change to non-admin
    if (userId === adminUserId) {
      if (is_banned === true) {
        return NextResponse.json(
          { error: 'Cannot ban your own account' },
          { status: 400 }
        )
      }
      if (role && role !== 'admin') {
        return NextResponse.json(
          { error: 'Cannot change your own role from admin' },
          { status: 400 }
        )
      }
    }

    const supabase = createAdminClient()

    // Validate role if provided
    const allowedRoles = ['student', 'parent', 'admin']
    if (role !== undefined && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (username !== undefined) updateData.username = username
    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role
    if (parent_id !== undefined) updateData.parent_id = parent_id || null
    if (xp !== undefined) updateData.xp = xp
    if (emeralds !== undefined) updateData.emeralds = emeralds
    if (is_banned !== undefined) updateData.is_banned = is_banned

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('Update user error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// GET - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = (page - 1) * limit

    // Get total count
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get paginated data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Get activity counts and learning days for all users
    const userIds = profiles?.map(p => p.id) || []

    // Get approved activities count per user
    const { data: activityCounts } = await supabase
      .from('completed_activities')
      .select('user_id')
      .eq('status', 'approved')
      .in('user_id', userIds)

    // Get learning days count per user
    const { data: learningDays } = await supabase
      .from('learning_days')
      .select('user_id')
      .in('user_id', userIds)

    // Create lookup maps
    const activityCountMap: Record<string, number> = {}
    const learningDaysMap: Record<string, number> = {}

    activityCounts?.forEach(a => {
      activityCountMap[a.user_id] = (activityCountMap[a.user_id] || 0) + 1
    })

    learningDays?.forEach(l => {
      learningDaysMap[l.user_id] = (learningDaysMap[l.user_id] || 0) + 1
    })

    // Enrich profiles with metrics
    const enrichedProfiles = profiles?.map(profile => ({
      ...profile,
      activities_count: activityCountMap[profile.id] || 0,
      learning_days_count: learningDaysMap[profile.id] || 0,
    }))

    return NextResponse.json({
      data: enrichedProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Fetch users error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
