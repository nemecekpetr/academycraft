'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Clock, User, Gift, Loader2 } from 'lucide-react'

interface PendingPurchase {
  id: string
  user_id: string
  item_id: string
  purchased_at: string
  user: {
    username: string
    email: string
  } | null
  item: {
    name: string
    icon: string
    price: number
    description: string | null
  } | null
}

export default function PurchasesPage() {
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadPendingPurchases()
  }, [])

  async function loadPendingPurchases() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        user_id,
        item_id,
        purchased_at,
        user:profiles(username, email),
        item:shop_items(name, icon, price, description)
      `)
      .eq('status', 'pending')
      .order('purchased_at', { ascending: true })

    if (!error && data) {
      setPendingPurchases(data as unknown as PendingPurchase[])
    }

    setLoading(false)
  }

  async function fulfillPurchase(item: PendingPurchase) {
    setProcessingId(item.id)
    const supabase = createClient()

    const { error } = await supabase
      .from('purchases')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error fulfilling purchase:', error)
      setProcessingId(null)
      return
    }

    setPendingPurchases(prev => prev.filter(p => p.id !== item.id))
    setProcessingId(null)
  }

  async function cancelPurchase(item: PendingPurchase) {
    setProcessingId(item.id)
    const supabase = createClient()

    // Refund emeralds to user
    if (item.item) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('emeralds')
        .eq('id', item.user_id)
        .single()

      if (userData) {
        await supabase
          .from('profiles')
          .update({
            emeralds: (userData.emeralds || 0) + item.item.price,
          })
          .eq('id', item.user_id)
      }
    }

    // Update purchase status
    const { error } = await supabase
      .from('purchases')
      .update({
        status: 'cancelled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', item.id)

    if (error) {
      console.error('Error cancelling purchase:', error)
      setProcessingId(null)
      return
    }

    setPendingPurchases(prev => prev.filter(p => p.id !== item.id))
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Plnění nákupů</h1>
        <p className="text-[var(--foreground-muted)]">
          Odměny čekající na předání studentovi
        </p>
      </div>

      {pendingPurchases.length === 0 ? (
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-12 text-center">
          <Gift className="w-16 h-16 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Žádné čekající nákupy</h2>
          <p className="text-[var(--foreground-muted)]">
            Všechny odměny byly předány
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPurchases.map((item) => (
            <div
              key={item.id}
              className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[var(--color-emerald)]/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--color-emerald)]" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.user?.username}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{item.user?.email}</p>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-rare)]/20 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-[var(--color-rare)]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{item.item?.name}</p>
                      {item.item?.description && (
                        <p className="text-sm text-[var(--foreground-muted)]">{item.item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
                    <span>Zakoupeno: {new Date(item.purchased_at).toLocaleString('cs-CZ')}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--color-emerald)]">💎 {item.item?.price}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelPurchase(item)}
                    disabled={processingId === item.id}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    title="Zrušit a vrátit emeraldy"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    Zrušit
                  </button>
                  <button
                    onClick={() => fulfillPurchase(item)}
                    disabled={processingId === item.id}
                    className="flex items-center gap-2 px-4 py-3 bg-[var(--color-emerald)]/20 text-[var(--color-emerald)] rounded-lg hover:bg-[var(--color-emerald)]/30 transition-colors disabled:opacity-50"
                  >
                    {processingId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Předáno
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
