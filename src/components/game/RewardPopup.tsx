'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface RewardPopupProps {
  isVisible: boolean
  xp?: number
  emeralds?: number
  isFlawless?: boolean
  onComplete?: () => void
}

export default function RewardPopup({
  isVisible,
  xp = 0,
  emeralds = 0,
  isFlawless = false,
  onComplete,
}: RewardPopupProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className={`mc-panel mc-panel-dark flex items-center gap-4 px-6 py-4 ${
              isFlawless ? 'border-[var(--color-gold)]' : 'border-[var(--color-emerald)]'
            }`}
          >
            {isFlawless && (
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="absolute -top-3 -right-3 bg-[var(--color-gold)] rounded-full p-1"
              >
                <Sparkles className="w-4 h-4 text-black" />
              </motion.div>
            )}

            {xp > 0 && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2"
              >
                <span className="text-2xl font-bold text-[var(--color-xp-green)]">
                  +{xp}
                </span>
                <span className="text-[var(--color-xp-green)]">XP</span>
              </motion.div>
            )}

            {emeralds > 0 && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="emerald-icon w-6 h-6" />
                <span className="text-2xl font-bold text-[var(--color-emerald)]">
                  +{emeralds}
                </span>
                {isFlawless && (
                  <span className="text-xs text-[var(--color-gold)]">(2x!)</span>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
