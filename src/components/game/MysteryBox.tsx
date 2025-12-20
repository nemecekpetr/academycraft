'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Sparkles, Loader2 } from 'lucide-react'
import { MYSTERY_BOX_REWARDS } from '@/lib/constants'

interface MysteryBoxProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => Promise<{ type: 'common' | 'rare' | 'legendary'; description: string } | null>
}

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  legendary: 'from-purple-400 to-purple-600',
}

const rarityNames = {
  common: 'Běžná',
  rare: 'Vzácná',
  legendary: 'Legendární',
}

const rarityGlow = {
  common: 'rgba(156,163,175,0.5)',
  rare: 'rgba(96,165,250,0.5)',
  legendary: 'rgba(192,132,252,0.5)',
}

export default function MysteryBox({ isOpen, onClose, onOpen }: MysteryBoxProps) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'opened'>('closed')
  const [reward, setReward] = useState<{ type: 'common' | 'rare' | 'legendary'; description: string } | null>(null)

  const handleOpen = async () => {
    setPhase('opening')

    // Simulate opening animation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const result = await onOpen()
    if (result) {
      setReward(result)
      setPhase('opened')
    } else {
      setPhase('closed')
    }
  }

  const handleClose = () => {
    setPhase('closed')
    setReward(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={phase === 'opened' ? handleClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {phase === 'closed' && (
              <>
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, -2, 2, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-40 h-40 bg-gradient-to-br from-[var(--color-gold)] to-yellow-700 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-gold)]/30"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
                    backgroundSize: '200% 200%',
                    animation: 'shimmer 3s infinite',
                  }}
                >
                  <Gift className="w-20 h-20 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-[var(--color-gold)] mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                  Mystery Box!
                </h2>
                <p className="text-[var(--foreground-muted)] mb-6">
                  7denní streak = tajemná odměna!
                </p>

                <button onClick={handleOpen} className="mc-button mc-button-primary px-8">
                  Otevřít
                </button>
              </>
            )}

            {phase === 'opening' && (
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, -5, 5, 0],
                  scale: [1, 1.1, 1, 1.1, 1, 1.05, 1],
                }}
                transition={{ duration: 1.5 }}
                className="w-40 h-40 bg-gradient-to-br from-[var(--color-gold)] to-yellow-700 rounded-lg flex items-center justify-center mx-auto"
              >
                <Loader2 className="w-20 h-20 text-white animate-spin" />
              </motion.div>
            )}

            {phase === 'opened' && reward && (
              <>
                {/* Particles */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1],
                      x: (Math.random() - 0.5) * 300,
                      y: (Math.random() - 0.5) * 300,
                    }}
                    transition={{ duration: 1, delay: Math.random() * 0.3 }}
                    className="absolute left-1/2 top-1/2"
                  >
                    <Sparkles className={`w-4 h-4 ${
                      reward.type === 'legendary' ? 'text-purple-400' :
                      reward.type === 'rare' ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                  </motion.div>
                ))}

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className={`w-32 h-32 bg-gradient-to-br ${rarityColors[reward.type]} rounded-full flex items-center justify-center mx-auto mb-6`}
                  style={{ boxShadow: `0 0 40px ${rarityGlow[reward.type]}` }}
                >
                  <Gift className="w-16 h-16 text-white" />
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className={`text-sm font-bold mb-2 ${
                    reward.type === 'legendary' ? 'text-purple-400' :
                    reward.type === 'rare' ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {rarityNames[reward.type]} odměna!
                  </p>

                  <h2 className="text-2xl font-bold text-white mb-6" style={{ textShadow: '2px 2px 0 #000' }}>
                    {reward.description}
                  </h2>

                  <button onClick={handleClose} className="mc-button mc-button-primary px-8">
                    Super!
                  </button>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
