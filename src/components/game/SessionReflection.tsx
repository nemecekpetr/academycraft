'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { getRandomEncouragement } from '@/lib/constants'

// 5-level difficulty scale
type DifficultyLevel = 1 | 2 | 3 | 4 | 5

interface SessionReflectionProps {
  isOpen: boolean
  onClose: () => void
  activityName: string
  onSubmit?: (difficulty: DifficultyLevel, enjoyment: boolean) => void
}

const difficultyOptions: { level: DifficultyLevel; emoji: string; label: string; color: string }[] = [
  { level: 1, emoji: '😫', label: 'Moc těžké', color: '#ef4444' },
  { level: 2, emoji: '😓', label: 'Těžké', color: '#f97316' },
  { level: 3, emoji: '😊', label: 'Akorát', color: '#22c55e' },
  { level: 4, emoji: '🙂', label: 'Lehké', color: '#3b82f6' },
  { level: 5, emoji: '😎', label: 'Hračka', color: '#8b5cf6' },
]

export default function SessionReflection({
  isOpen,
  onClose,
  activityName,
  onSubmit,
}: SessionReflectionProps) {
  const { theme } = useTheme()
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null)
  const [enjoyment, setEnjoyment] = useState<boolean | null>(null)
  const [showThanks, setShowThanks] = useState(false)

  const handleSubmit = () => {
    if (difficulty && enjoyment !== null) {
      onSubmit?.(difficulty, enjoyment)
      setShowThanks(true)
      setTimeout(() => {
        onClose()
        setDifficulty(null)
        setEnjoyment(null)
        setShowThanks(false)
      }, 2000)
    }
  }

  const handleSkip = () => {
    onClose()
    setDifficulty(null)
    setEnjoyment(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md p-6 rounded-xl border-2"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.backgroundLight,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showThanks ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center py-8"
              >
                <Sparkles
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: theme.colors.primary }}
                />
                <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                  Díky za zpětnou vazbu!
                </h3>
                <p style={{ color: theme.colors.textMuted }}>
                  {getRandomEncouragement()}
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                    Jak to šlo?
                  </h3>
                  <button onClick={handleSkip} style={{ color: theme.colors.textMuted }}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>
                  Dokončil/a jsi: <strong style={{ color: theme.colors.text }}>{activityName}</strong>
                </p>

                {/* 5-Level Difficulty Scale */}
                <div className="mb-6">
                  <p className="text-sm font-bold mb-3" style={{ color: theme.colors.text }}>
                    Jak náročné to bylo?
                  </p>
                  <div className="flex justify-between gap-1">
                    {difficultyOptions.map((option) => {
                      const isSelected = difficulty === option.level
                      return (
                        <motion.button
                          key={option.level}
                          onClick={() => setDifficulty(option.level)}
                          className="flex-1 flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all"
                          style={{
                            backgroundColor: isSelected
                              ? `${option.color}20`
                              : theme.colors.backgroundLight,
                            border: `2px solid ${isSelected ? option.color : 'transparent'}`,
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span
                            className="text-[10px] font-bold leading-tight text-center"
                            style={{ color: isSelected ? option.color : theme.colors.textMuted }}
                          >
                            {option.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Enjoyment Question */}
                <div className="mb-6">
                  <p className="text-sm font-bold mb-3" style={{ color: theme.colors.text }}>
                    Bavilo tě to?
                  </p>
                  <div className="flex justify-center gap-3">
                    {[
                      { value: true, label: 'Ano!', emoji: '😊' },
                      { value: false, label: 'Moc ne', emoji: '😐' },
                    ].map((option) => {
                      const isSelected = enjoyment === option.value
                      return (
                        <motion.button
                          key={String(option.value)}
                          onClick={() => setEnjoyment(option.value)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all"
                          style={{
                            backgroundColor: isSelected
                              ? `${theme.colors.primary}20`
                              : theme.colors.backgroundLight,
                            border: `2px solid ${isSelected ? theme.colors.primary : 'transparent'}`,
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span
                            className="font-bold"
                            style={{
                              color: isSelected ? theme.colors.primary : theme.colors.textMuted,
                            }}
                          >
                            {option.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!difficulty || enjoyment === null}
                  className="w-full py-4 px-4 rounded-xl font-bold text-white text-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Odeslat
                </button>

                {/* Skip option */}
                <button
                  onClick={handleSkip}
                  className="w-full mt-3 py-2 text-sm"
                  style={{ color: theme.colors.textMuted }}
                >
                  Přeskočit
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
