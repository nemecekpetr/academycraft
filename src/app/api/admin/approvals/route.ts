import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdminOrParent } from '@/lib/supabase/admin'
import { normalizeJoinResult } from '@/lib/supabase/utils'

interface ApproveRequest {
  activityId: string
  action: 'approve' | 'reject'
  recognitionMessage?: string
  activityDate?: string  // YYYY-MM-DD format
}

export async function POST(request: NextRequest) {
  try {
    // Verify the user is admin or parent
    const { userId, role } = await requireAdminOrParent()

    const body: ApproveRequest = await request.json()
    const { activityId, action, recognitionMessage, activityDate } = body

    if (!activityId || !action) {
      return NextResponse.json(
        { error: 'Missing activityId or action' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Validate activityDate if provided (must not be in the future)
    let validatedActivityDate: string | null = null
    if (activityDate) {
      const dateObj = new Date(activityDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (isNaN(dateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid activity date format' },
          { status: 400 }
        )
      }

      if (dateObj > today) {
        return NextResponse.json(
          { error: 'Activity date cannot be in the future' },
          { status: 400 }
        )
      }

      validatedActivityDate = activityDate
    }

    const supabase = createAdminClient()

    // Get the pending activity with user and activity info
    const { data: completedActivity, error: fetchError } = await supabase
      .from('completed_activities')
      .select(`
        id,
        user_id,
        score,
        activity:activities(adventure_points, skill_area_id),
        user:profiles!completed_activities_user_id_fkey(adventure_points, parent_id)
      `)
      .eq('id', activityId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !completedActivity) {
      return NextResponse.json(
        { error: 'Activity not found or already processed' },
        { status: 404 }
      )
    }

    // Normalize join results
    const activity = normalizeJoinResult(completedActivity.activity) as {
      adventure_points: number
      skill_area_id: string | null
    } | null

    const user = normalizeJoinResult(completedActivity.user) as {
      adventure_points: number
      parent_id: string | null
    } | null

    if (!activity || !user) {
      return NextResponse.json(
        { error: 'Activity or user data not found' },
        { status: 404 }
      )
    }

    // CRITICAL: Validate parent-child relationship if user is a parent (not admin)
    if (role === 'parent') {
      if (user.parent_id !== userId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only approve activities of your own children' },
          { status: 403 }
        )
      }
    }

    // Handle rejection
    if (action === 'reject') {
      const { error: rejectError } = await supabase
        .from('completed_activities')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', activityId)

      if (rejectError) {
        return NextResponse.json(
          { error: 'Failed to reject activity' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    // Handle approval using atomic function
    const adventurePoints = activity.adventure_points || 10

    // Try to use atomic function first (if available in DB)
    const { data: atomicResult, error: atomicError } = await supabase.rpc(
      'approve_activity_atomic',
      {
        p_activity_id: activityId,
        p_adventure_points: adventurePoints,
        p_user_id: completedActivity.user_id,
        p_skill_area_id: activity.skill_area_id,
        p_parent_id: user.parent_id,
        p_recognition_message: recognitionMessage?.trim() || null,
        p_activity_date: validatedActivityDate,
      }
    )

    // If atomic function exists and succeeded
    if (!atomicError && atomicResult) {
      return NextResponse.json({
        success: true,
        action: 'approved',
        rewards: {
          adventurePoints,
        },
      })
    }

    // Fallback to non-atomic approach if function doesn't exist
    // Log warning about potential race condition
    if (atomicError) {
      console.warn(
        'Atomic function not available, falling back to non-atomic approach:',
        atomicError.message
      )
    }

    // Fallback: Update completed_activities
    const { error: activityError } = await supabase
      .from('completed_activities')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', activityId)

    if (activityError) {
      console.error('Error updating activity:', activityError)
      return NextResponse.json(
        { error: 'Failed to approve activity' },
        { status: 500 }
      )
    }

    // Fallback: Try atomic increment via RPC, else use update
    const { error: incrementError } = await supabase.rpc('increment_adventure_points', {
      user_id: completedActivity.user_id,
      points_to_add: adventurePoints,
    })

    if (incrementError) {
      // Final fallback: direct update (not atomic, but better than nothing)
      console.warn('increment_adventure_points RPC failed, using direct update:', incrementError.message)
      const { error: userError } = await supabase
        .from('profiles')
        .update({
          adventure_points: (user.adventure_points || 0) + adventurePoints,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', completedActivity.user_id)

      if (userError) {
        console.error('Error updating user:', userError)
      }
    }

    // Record learning day (use activityDate if provided, otherwise today)
    const learningDate = validatedActivityDate || new Date().toISOString().split('T')[0]
    const { error: learningDayError } = await supabase
      .from('learning_days')
      .upsert(
        {
          user_id: completedActivity.user_id,
          learning_date: learningDate,
          activities_count: 1,
        },
        {
          onConflict: 'user_id,learning_date',
        }
      )

    if (learningDayError) {
      console.error('Error recording learning day:', learningDayError)
    }

    // Update skill progress if skill area is set
    if (activity.skill_area_id) {
      const { data: existingProgress } = await supabase
        .from('skill_progress')
        .select('id, activities_completed')
        .eq('user_id', completedActivity.user_id)
        .eq('skill_area_id', activity.skill_area_id)
        .single()

      if (existingProgress) {
        const newCount = (existingProgress.activities_completed || 0) + 1
        let newLevel = 'exploring'
        if (newCount >= 20) newLevel = 'teaching'
        else if (newCount >= 10) newLevel = 'confident'
        else if (newCount >= 5) newLevel = 'growing'

        await supabase
          .from('skill_progress')
          .update({
            activities_completed: newCount,
            mastery_level: newLevel,
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id)
      } else {
        await supabase.from('skill_progress').insert({
          user_id: completedActivity.user_id,
          skill_area_id: activity.skill_area_id,
          activities_completed: 1,
          mastery_level: 'exploring',
          last_activity_at: new Date().toISOString(),
        })
      }
    }

    // Contribute to active family adventure if parent exists
    if (user.parent_id) {
      const { data: activeAdventure } = await supabase
        .from('family_adventures')
        .select('id, points_current, points_needed')
        .eq('family_id', user.parent_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (activeAdventure) {
        await supabase.from('adventure_contributions').insert({
          adventure_id: activeAdventure.id,
          user_id: completedActivity.user_id,
          activity_id: activityId,
          points_contributed: adventurePoints,
        })

        const newPoints = (activeAdventure.points_current || 0) + adventurePoints
        const isAchieved = newPoints >= activeAdventure.points_needed

        await supabase
          .from('family_adventures')
          .update({
            points_current: newPoints,
            ...(isAchieved
              ? { status: 'achieved', achieved_at: new Date().toISOString() }
              : {}),
          })
          .eq('id', activeAdventure.id)
      }
    }

    // Create recognition if message provided
    if (recognitionMessage && recognitionMessage.trim()) {
      await supabase.from('recognitions').insert({
        user_id: completedActivity.user_id,
        recognition_type: 'parent_note',
        title: 'Zprava od rodice',
        message: recognitionMessage,
        related_activity_id: activityId,
      })
    }

    return NextResponse.json({
      success: true,
      action: 'approved',
      rewards: {
        adventurePoints,
      },
    })
  } catch (error) {
    console.error('Approval error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}

// GET endpoint to list pending approvals with pagination and proper filtering
export async function GET(request: NextRequest) {
  try {
    const { userId, role } = await requireAdminOrParent()

    const supabase = createAdminClient()

    // Parse pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // For parents, first get their children's IDs to filter at DB level
    let childrenIds: string[] | null = null
    if (role === 'parent') {
      const { data: children } = await supabase
        .from('profiles')
        .select('id')
        .eq('parent_id', userId)

      childrenIds = children?.map(c => c.id) || []

      // If parent has no children, return empty
      if (childrenIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        })
      }
    }

    // Build query with proper filtering
    let countQuery = supabase
      .from('completed_activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    let dataQuery = supabase
      .from('completed_activities')
      .select(
        `
        id,
        user_id,
        activity_id,
        score,
        notes,
        submitted_at,
        activity_date,
        user:profiles!completed_activities_user_id_fkey(username, email, adventure_points, parent_id),
        activity:activities(name, icon, adventure_points, max_score, purpose_message, skill_area:skill_areas(name, color))
      `
      )
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply children filter for parents at DB level
    if (childrenIds) {
      countQuery = countQuery.in('user_id', childrenIds)
      dataQuery = dataQuery.in('user_id', childrenIds)
    }

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery
    ])

    if (error) {
      console.error('Error fetching pending activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending activities' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Fetch approvals error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch pending activities' },
      { status: 500 }
    )
  }
}
