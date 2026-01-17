import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify the user is admin and get their ID
    const adminUserId = await requireAdmin()

    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent self-delete
    if (id === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Delete the user from auth.users (this will cascade to profiles due to FK)
    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
