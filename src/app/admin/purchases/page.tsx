'use client'

import { useState, useEffect } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPendingPurchases()
  }, [])

  async function loadPendingPurchases() {
    try {
      const response = await fetch('/api/admin/purchases')
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to load purchases')
        setLoading(false)
        return
      }

      // Normalize join results
      const normalizedData = result.data?.map((item: PendingPurchase) => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user,
        item: Array.isArray(item.item) ? item.item[0] : item.item,
      })) || []

      setPendingPurchases(normalizedData)
    } catch (err) {
      console.error('Error loading purchases:', err)
      setError('Nepodařilo se načíst nákupy')
    }
    setLoading(false)
  }

  async function fulfillPurchase(purchase: PendingPurchase) {
    setProcessingId(purchase.id)
    setError(null)

    try {
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: purchase.id,
          action: 'fulfill',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se potvrdit předání')
        setProcessingId(null)
        return
      }

      setPendingPurchases(prev => prev.filter(p => p.id !== purchase.id))
    } catch (err) {
      console.error('Error fulfilling purchase:', err)
      setError('Nepodařilo se potvrdit předání')
    }

    setProcessingId(null)
  }

  async function cancelPurchase(purchase: PendingPurchase) {
    setProcessingId(purchase.id)
    setError(null)

    try {
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: purchase.id,
          action: 'cancel',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Nepodařilo se zrušit nákup')
        setProcessingId(null)
        return
      }

      setPendingPurchases(prev => prev.filter(p => p.id !== purchase.id))
    } catch (err) {
      console.error('Error cancelling purchase:', err)
      setError('Nepodařilo se zrušit nákup')
    }

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

      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500 p-4 rounded-lg text-red-400">
          {error}
        </div>
      )}

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
          {pendingPurchases.map((purchase) => (
            <div
              key={purchase.id}
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
                      <p className="font-bold text-white">{purchase.user?.username}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{purchase.user?.email}</p>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[var(--color-rare)]/20 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-[var(--color-rare)]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{purchase.item?.name}</p>
                      {purchase.item?.description && (
                        <p className="text-sm text-[var(--foreground-muted)]">{purchase.item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-[var(--foreground-muted)]">
                    <span>Zakoupeno: {new Date(purchase.purchased_at).toLocaleString('cs-CZ')}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[var(--color-emerald)]">💎 {purchase.item?.price}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => cancelPurchase(purchase)}
                    disabled={processingId === purchase.id}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    title="Zrušit a vrátit emeraldy"
                  >
                    {processingId === purchase.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    Zrušit
                  </button>
                  <button
                    onClick={() => fulfillPurchase(purchase)}
                    disabled={processingId === purchase.id}
                    className="flex items-center gap-2 px-4 py-3 bg-[var(--color-emerald)]/20 text-[var(--color-emerald)] rounded-lg hover:bg-[var(--color-emerald)]/30 transition-colors disabled:opacity-50"
                  >
                    {processingId === purchase.id ? (
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
