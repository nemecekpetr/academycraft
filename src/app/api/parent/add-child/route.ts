import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email je povinný' }, { status: 400 })
    }

    // Get current user (parent)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    // Verify the current user is a parent
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Pouze rodiče mohou přidávat děti' }, { status: 403 })
    }

    // Use admin client to find student by email (bypasses RLS)
    const adminClient = createAdminClient()
    const normalizedEmail = email.trim().toLowerCase()

    console.log('Searching for student with email:', normalizedEmail)

    const { data: student, error: findError } = await adminClient
      .from('profiles')
      .select('id, username, email, role, parent_id')
      .eq('email', normalizedEmail)
      .single()

    console.log('Search result:', { student, findError })

    if (findError || !student) {
      // Try to find without case sensitivity - list all to debug
      const { data: allProfiles } = await adminClient
        .from('profiles')
        .select('email, role')
        .eq('role', 'student')
      console.log('All student emails in DB:', allProfiles?.map(p => p.email))

      return NextResponse.json({ error: 'Student s tímto emailem nebyl nalezen' }, { status: 404 })
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Tento uživatel není student' }, { status: 400 })
    }

    if (student.parent_id) {
      return NextResponse.json({ error: 'Tento student již má přiřazeného rodiče' }, { status: 400 })
    }

    // Assign child to parent
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ parent_id: parentProfile.id })
      .eq('id', student.id)

    if (updateError) {
      console.error('Error assigning child:', updateError)
      return NextResponse.json({ error: 'Nepodařilo se přiřadit dítě' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      username: student.username
    })

  } catch (error) {
    console.error('Add child error:', error)
    return NextResponse.json({ error: 'Neočekávaná chyba' }, { status: 500 })
  }
}
