'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { getLevelFromXp, LEVELS } from '@/lib/levels'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Candy,
  Gamepad2,
  Film,
  Sparkles,
  UtensilsCrossed,
  Pizza,
  PiggyBank,
  Map,
  Gift,
  Clock,
  Loader2,
  Check,
  X,
  Lock,
  Gem,
  type LucideProps,
} from 'lucide-react'
import type { ShopItem, Purchase } from '@/types/database'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  candy: Candy,
  'gamepad-2': Gamepad2,
  film: Film,
  sparkles: Sparkles,
  utensils: UtensilsCrossed,
  pizza: Pizza,
  'piggy-bank': PiggyBank,
  map: Map,
  gift: Gift,
}

interface ShopItemsProps {
  items: ShopItem[]
  pendingPurchases: (Purchase & { item: { name: string; icon: string; price: number } | null })[]
  userId: string
  userEmeralds: number
  userXp: number
}

export default function ShopItems({ items, pendingPurchases, userId, userEmeralds, userXp }: ShopItemsProps) {
  const { theme } = useTheme()
  const userLevel = getLevelFromXp(userXp)
  const router = useRouter()
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async () => {
    if (!selectedItem) return

    if (userEmeralds < selectedItem.price) {
      setError('Nemáš dostatek emeraldů!')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Call the process_purchase function
    const { error: purchaseError } = await supabase.rpc('process_purchase', {
      p_user_id: userId,
      p_item_id: selectedItem.id,
    })

    if (purchaseError) {
      console.error('Error purchasing item:', purchaseError)
      setError('Chyba při nákupu. Zkus to znovu.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      setSelectedItem(null)
      setSuccess(false)
      router.refresh()
    }, 1500)

    setLoading(false)
  }

  return (
    <>
      {/* Pending Purchases */}
      {pendingPurchases.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Clock className="w-5 h-5" style={{ color: theme.colors.accent }} />
            Čeká na splnění ({pendingPurchases.length})
          </h2>
          <div className="space-y-2">
            {pendingPurchases.map((purchase) => {
              const Icon = iconMap[purchase.item?.icon || 'gift'] || Gift
              return (
                <div
                  key={purchase.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2"
                  style={{
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.backgroundLight
                  }}
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.accent}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: theme.colors.accent }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style={{ color: theme.colors.text }}>{purchase.item?.name}</p>
                    <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                      {new Date(purchase.purchased_at).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${theme.colors.accent}20`,
                      color: theme.colors.accent
                    }}
                  >
                    Čeká
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Shop Items Grid */}
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || Gift
          const canAfford = userEmeralds >= item.price
          const hasRequiredLevel = userLevel.level >= (item.min_level || 1)
          const canBuy = canAfford && hasRequiredLevel
          const requiredLevel = LEVELS.find(l => l.level === (item.min_level || 1))
          const isLocked = !hasRequiredLevel

          return (
            <motion.button
              key={item.id}
              onClick={() => canBuy && setSelectedItem(item)}
              title={item.description || item.name}
              className={`text-center p-3 relative border-2 rounded-xl ${
                canBuy ? 'cursor-pointer' : 'cursor-not-allowed'
              } transition-all`}
              style={{
                backgroundColor: isLocked ? theme.colors.backgroundLight : theme.colors.card,
                borderColor: isLocked ? theme.colors.backgroundLight : theme.colors.backgroundLight,
                opacity: isLocked ? 0.7 : 1
              }}
              whileHover={canBuy ? { scale: 1.03 } : {}}
              whileTap={canBuy ? { scale: 0.97 } : {}}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-1"
                style={{ backgroundColor: isLocked ? `${theme.colors.textMuted}20` : `${theme.colors.currency}20` }}
              >
                {isLocked ? (
                  <Lock className="w-5 h-5" style={{ color: theme.colors.textMuted }} />
                ) : (
                  <Icon className="w-5 h-5" style={{ color: theme.colors.currency }} />
                )}
              </div>

              {/* Name */}
              <h3
                className="font-bold text-xs mb-1 line-clamp-2 min-h-[2rem]"
                style={{ color: isLocked ? theme.colors.textMuted : theme.colors.text }}
              >
                {item.name}
              </h3>

              {/* Level requirement for locked items */}
              {isLocked && (
                <div
                  className="text-[10px] mb-1 px-1 py-0.5 rounded inline-block"
                  style={{
                    backgroundColor: `${theme.colors.textMuted}20`,
                    color: theme.colors.textMuted
                  }}
                >
                  Lv.{item.min_level}
                </div>
              )}

              {/* Level badge for unlocked items with level req */}
              {!isLocked && (item.min_level || 1) > 1 && (
                <div className="text-[10px] mb-1" style={{ color: theme.colors.textMuted }}>
                  {requiredLevel?.icon} Lv.{item.min_level}
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-center gap-1">
                <Gem className="w-4 h-4" style={{ color: isLocked ? theme.colors.textMuted : (canAfford ? theme.colors.currency : '#ef4444') }} />
                <span
                  className="font-bold text-sm"
                  style={{ color: isLocked ? theme.colors.textMuted : (canAfford ? theme.colors.currency : '#ef4444') }}
                >
                  {item.price}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => !loading && setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm p-6 rounded-xl border-2"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.backgroundLight
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {success ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                    Nakoupeno!
                  </h3>
                  <p style={{ color: theme.colors.textMuted }}>
                    Čeká na splnění
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>Koupit odměnu?</h3>
                    <button
                      onClick={() => setSelectedItem(null)}
                      style={{ color: theme.colors.textMuted }}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="text-center py-4">
                    {(() => {
                      const Icon = iconMap[selectedItem.icon] || Gift
                      return (
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4"
                          style={{ backgroundColor: `${theme.colors.currency}20` }}
                        >
                          <Icon className="w-10 h-10" style={{ color: theme.colors.currency }} />
                        </div>
                      )
                    })()}
                    <h4 className="text-lg font-bold mb-2" style={{ color: theme.colors.text }}>{selectedItem.name}</h4>
                    {selectedItem.description && (
                      <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
                        {selectedItem.description}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xl">
                      <Gem className="w-6 h-6" style={{ color: theme.colors.currency }} />
                      <span className="font-bold" style={{ color: theme.colors.currency }}>
                        {selectedItem.price}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-900/50 border-2 border-red-500 p-3 text-red-200 text-sm mb-4 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="flex-1 py-3 px-4 rounded-lg font-bold transition-colors"
                      style={{
                        backgroundColor: theme.colors.backgroundLight,
                        color: theme.colors.text
                      }}
                    >
                      Zrušit
                    </button>
                    <button
                      onClick={handlePurchase}
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-colors"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Koupit'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
