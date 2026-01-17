import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/lib/supabase/admin'

interface ActivityData {
  name: string
  description?: string
  adventure_points: number
  xp_reward?: number
  emerald_reward?: number
  icon?: string
  requires_approval: boolean
  requires_score: boolean
  max_score?: number | null
  is_active: boolean
  skill_area_id?: string | null
  purpose_message?: string | null
}

// POST - Create new activity
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body: ActivityData = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Activity name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const dataToInsert = {
      name: body.name,
      description: body.description || null,
      adventure_points: body.adventure_points || 10,
      xp_reward: body.xp_reward || 0,
      emerald_reward: body.emerald_reward || 0,
      icon: body.icon || 'star',
      requires_approval: body.requires_approval ?? true,
      requires_score: body.requires_score ?? false,
      max_score: body.requires_score ? body.max_score : null,
      is_active: body.is_active ?? true,
      skill_area_id: body.skill_area_id || null,
      purpose_message: body.purpose_message || null,
    }

    const { data, error } = await supabase
      .from('activities')
      .insert(dataToInsert)
      .select(`
        *,
        skill_area:skill_areas(id, name, color, icon)
      `)
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, activity: data })
  } catch (error) {
    console.error('Create activity error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

// PATCH - Update activity
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { activityId, ...updateFields } = body

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (updateFields.name !== undefined) updateData.name = updateFields.name
    if (updateFields.description !== undefined) updateData.description = updateFields.description
    if (updateFields.adventure_points !== undefined) updateData.adventure_points = updateFields.adventure_points
    if (updateFields.xp_reward !== undefined) updateData.xp_reward = updateFields.xp_reward
    if (updateFields.emerald_reward !== undefined) updateData.emerald_reward = updateFields.emerald_reward
    if (updateFields.icon !== undefined) updateData.icon = updateFields.icon
    if (updateFields.requires_approval !== undefined) updateData.requires_approval = updateFields.requires_approval
    if (updateFields.requires_score !== undefined) updateData.requires_score = updateFields.requires_score
    if (updateFields.max_score !== undefined) updateData.max_score = updateFields.requires_score ? updateFields.max_score : null
    if (updateFields.is_active !== undefined) updateData.is_active = updateFields.is_active
    if (updateFields.skill_area_id !== undefined) updateData.skill_area_id = updateFields.skill_area_id || null
    if (updateFields.purpose_message !== undefined) updateData.purpose_message = updateFields.purpose_message || null

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select(`
        *,
        skill_area:skill_areas(id, name, color, icon)
      `)
      .single()

    if (error) {
      console.error('Error updating activity:', error)
      return NextResponse.json(
        { error: 'Failed to update activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, activity: data })
  } catch (error) {
    console.error('Update activity error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// DELETE - Delete activity
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (error) {
      console.error('Error deleting activity:', error)
      return NextResponse.json(
        { error: 'Failed to delete activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete activity error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}

// GET - List all activities
export async function GET() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        skill_area:skill_areas(id, name, color, icon)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Fetch activities error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
