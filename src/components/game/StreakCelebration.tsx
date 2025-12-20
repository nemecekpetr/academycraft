'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakCelebrationProps {
  isOpen: boolean
  onClose: () => void
  streakDays: number
}

export default function StreakCelebration({ isOpen, onClose, streakDays }: StreakCelebrationProps) {
  const isMilestone = streakDays % 7 === 0 || streakDays === 3 || streakDays === 5

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            transition={{ type: 'spring', damping: 15 }}
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Flames animation */}
            <div className="relative">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: -100,
                    x: (i - 2) * 30,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="absolute left-1/2 -translate-x-1/2"
                >
                  <Flame className="w-8 h-8 text-orange-500" />
                </motion.div>
              ))}

              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  isMilestone
                    ? 'bg-gradient-to-br from-orange-500 to-red-600'
                    : 'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}
                style={{
                  boxShadow: isMilestone
                    ? '0 0 60px rgba(249,115,22,0.8)'
                    : '0 0 30px rgba(249,115,22,0.5)',
                }}
              >
                <Flame className="w-16 h-16 text-white" />
              </motion.div>
            </div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-orange-400 mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              {isMilestone ? '🔥 STREAK MILESTONE!' : '🔥 STREAK!'}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-white mb-2"
              style={{ textShadow: '3px 3px 0 #000' }}
            >
              {streakDays} {streakDays === 1 ? 'den' : streakDays < 5 ? 'dny' : 'dní'}
            </motion.p>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[var(--foreground-muted)] mb-6"
            >
              {streakDays >= 7 && streakDays % 7 === 0
                ? '🎁 Máš nárok na Mystery Box!'
                : streakDays === 6
                ? 'Ještě 1 den do Mystery Boxu!'
                : 'Pokračuj v dobré práci!'}
            </motion.p>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="mc-button mc-button-primary px-8"
            >
              Pokračovat
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
