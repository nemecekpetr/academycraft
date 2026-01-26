import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate a cryptographically secure 6-digit verification code
function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString()
}

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
      .select('id, role, email, username')
      .eq('id', user.id)
      .single()

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Pouze rodiče mohou přidávat děti' }, { status: 403 })
    }

    // Use admin client to find student by email (bypasses RLS)
    const adminClient = createAdminClient()
    const normalizedEmail = email.trim().toLowerCase()

    const { data: student, error: findError } = await adminClient
      .from('profiles')
      .select('id, username, email, role, parent_id')
      .eq('email', normalizedEmail)
      .single()

    if (findError || !student) {
      return NextResponse.json({ error: 'Student s tímto emailem nebyl nalezen' }, { status: 404 })
    }

    if (student.role !== 'student') {
      return NextResponse.json({ error: 'Tento uživatel není student' }, { status: 400 })
    }

    if (student.parent_id) {
      return NextResponse.json({ error: 'Tento student již má přiřazeného rodiče' }, { status: 400 })
    }

    // Check if there's already a pending link from this parent to this child
    const { data: existingLink } = await adminClient
      .from('pending_parent_links')
      .select('id, expires_at')
      .eq('parent_id', parentProfile.id)
      .eq('child_id', student.id)
      .single()

    if (existingLink) {
      // Check if expired
      if (new Date(existingLink.expires_at) > new Date()) {
        return NextResponse.json({
          error: 'Žádost o propojení již byla odeslána. Čeká na potvrzení od dítěte.'
        }, { status: 400 })
      }
      // Delete expired link
      await adminClient
        .from('pending_parent_links')
        .delete()
        .eq('id', existingLink.id)
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Create pending link
    const { error: insertError } = await adminClient
      .from('pending_parent_links')
      .insert({
        parent_id: parentProfile.id,
        child_id: student.id,
        verification_code: verificationCode,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })

    if (insertError) {
      console.error('Error creating pending link:', insertError)
      return NextResponse.json({ error: 'Nepodařilo se vytvořit žádost o propojení' }, { status: 500 })
    }

    // Send email notification to child with verification code
    let emailSent = true
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://academycraft.vercel.app'

      const emailResponse = await fetch(`${appUrl}/api/notifications/parent-link-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childEmail: student.email,
          childName: student.username,
          parentName: parentProfile.username,
          verificationCode: verificationCode,
        }),
      })

      if (!emailResponse.ok) {
        emailSent = false
        console.error('Email notification returned error:', await emailResponse.text())
      }
    } catch (emailError) {
      emailSent = false
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails - the code is still valid
    }

    return NextResponse.json({
      success: true,
      username: student.username,
      pending: true,
      message: 'Žádost o propojení byla odeslána. Dítě musí potvrdit kódem.',
      emailSent,
    })

  } catch (error) {
    console.error('Add child error:', error)
    return NextResponse.json({ error: 'Neočekávaná chyba' }, { status: 500 })
  }
}

// GET - List pending child requests for the current parent
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    const { data: pendingLinks, error } = await supabase
      .from('pending_parent_links')
      .select(`
        id,
        child_id,
        expires_at,
        created_at,
        child:profiles!pending_parent_links_child_id_fkey(id, username, email)
      `)
      .eq('parent_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending links:', error)
      return NextResponse.json({ error: 'Nepodařilo se načíst žádosti' }, { status: 500 })
    }

    return NextResponse.json({ data: pendingLinks })

  } catch (error) {
    console.error('Get pending links error:', error)
    return NextResponse.json({ error: 'Neočekávaná chyba' }, { status: 500 })
  }
}

// DELETE - Cancel a pending link request
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json({ error: 'ID žádosti je povinné' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })
    }

    // Use select() to verify the delete actually affected a row
    const { data, error } = await supabase
      .from('pending_parent_links')
      .delete()
      .eq('id', linkId)
      .eq('parent_id', user.id)
      .select()

    if (error) {
      console.error('Error deleting pending link:', error)
      return NextResponse.json({ error: 'Nepodařilo se zrušit žádost' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Žádost nebyla nalezena' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete pending link error:', error)
    return NextResponse.json({ error: 'Neočekávaná chyba' }, { status: 500 })
  }
}
