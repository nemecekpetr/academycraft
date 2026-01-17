import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/lib/supabase/admin'

interface PurchaseActionRequest {
  purchaseId: string
  action: 'fulfill' | 'cancel'
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body: PurchaseActionRequest = await request.json()
    const { purchaseId, action } = body

    if (!purchaseId || !action) {
      return NextResponse.json(
        { error: 'Missing purchaseId or action' },
        { status: 400 }
      )
    }

    if (action !== 'fulfill' && action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "fulfill" or "cancel"' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the purchase with item info
    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        status,
        item:shop_items(price)
      `)
      .eq('id', purchaseId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !purchase) {
      return NextResponse.json(
        { error: 'Purchase not found or already processed' },
        { status: 404 }
      )
    }

    // Handle fulfillment
    if (action === 'fulfill') {
      const { error: fulfillError } = await supabase
        .from('purchases')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', purchaseId)

      if (fulfillError) {
        return NextResponse.json(
          { error: 'Failed to fulfill purchase' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, action: 'fulfilled' })
    }

    // Handle cancellation with refund
    if (action === 'cancel') {
      const item = Array.isArray(purchase.item) ? purchase.item[0] : purchase.item
      const refundAmount = item?.price || 0

      if (refundAmount > 0) {
        // Try atomic increment first
        const { error: incrementError } = await supabase.rpc('increment_emeralds', {
          user_id: purchase.user_id,
          emeralds_to_add: refundAmount,
        })

        if (incrementError) {
          // Fallback to direct update if RPC not available
          console.warn('increment_emeralds RPC failed, using direct update:', incrementError.message)

          const { data: userData, error: userFetchError } = await supabase
            .from('profiles')
            .select('emeralds')
            .eq('id', purchase.user_id)
            .single()

          if (userFetchError) {
            return NextResponse.json(
              { error: 'Failed to fetch user for refund' },
              { status: 500 }
            )
          }

          const { error: refundError } = await supabase
            .from('profiles')
            .update({
              emeralds: (userData?.emeralds || 0) + refundAmount,
            })
            .eq('id', purchase.user_id)

          if (refundError) {
            return NextResponse.json(
              { error: 'Failed to refund emeralds' },
              { status: 500 }
            )
          }
        }
      }

      // Update purchase status
      const { error: cancelError } = await supabase
        .from('purchases')
        .update({
          status: 'cancelled',
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', purchaseId)

      if (cancelError) {
        return NextResponse.json(
          { error: 'Failed to cancel purchase' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'cancelled',
        refunded: refundAmount
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Purchase action error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to process purchase action' },
      { status: 500 }
    )
  }
}

// GET endpoint to list pending purchases
export async function GET() {
  try {
    await requireAdmin()

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        item_id,
        purchased_at,
        user:profiles!purchases_user_id_fkey(username, email),
        item:shop_items(name, icon, price, description)
      `)
      .eq('status', 'pending')
      .order('purchased_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending purchases:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending purchases' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Fetch purchases error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Unauthorized') || message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch pending purchases' },
      { status: 500 }
    )
  }
}
