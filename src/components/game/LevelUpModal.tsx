'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Star, Sparkles } from 'lucide-react'

interface LevelUpModalProps {
  isOpen: boolean
  onClose: () => void
  newLevel: number
}

export default function LevelUpModal({ isOpen, onClose, newLevel }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5],
                  x: Math.cos((i * 30 * Math.PI) / 180) * 150,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 150,
                }}
                transition={{ delay: 0.2, duration: 1 }}
                className="absolute"
                style={{ left: '50%', top: '50%' }}
              >
                <Sparkles className="w-6 h-6 text-[var(--color-gold)]" />
              </motion.div>
            ))}

            {/* Main content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{
                  rotate: [0, -5, 5, -5, 5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-32 h-32 bg-gradient-to-br from-[var(--color-gold)] to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-gold)]/50"
              >
                <Star className="w-16 h-16 text-white" fill="white" />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-[var(--color-gold)] mb-2"
                style={{ textShadow: '2px 2px 0 #000, 0 0 20px rgba(255,215,0,0.5)' }}
              >
                LEVEL UP!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-6xl font-bold text-white mb-4"
                style={{ textShadow: '3px 3px 0 #000' }}
              >
                {newLevel}
              </motion.p>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[var(--foreground-muted)] mb-6"
              >
                Tvoje snaha se vyplácí! Každým dnem se zlepšuješ.
              </motion.p>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                onClick={onClose}
                className="mc-button mc-button-primary px-8"
              >
                Jdu dál!
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
