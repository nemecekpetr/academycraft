'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, Star, Trophy, X, MessageCircle } from 'lucide-react'
import type { Recognition, RecognitionType } from '@/types/database'

interface RecognitionCardProps {
  recognition: Recognition
  onDismiss?: (id: string) => void
  showTimestamp?: boolean
}

// Recognition type styling
const RECOGNITION_STYLES: Record<
  RecognitionType,
  { icon: React.ReactNode; color: string; bgGradient: string; label: string }
> = {
  parent_note: {
    icon: <Heart className="w-full h-full" />,
    color: '#FF6B9D',
    bgGradient: 'from-pink-500/20 to-red-500/20',
    label: 'Zpráva od rodiče',
  },
  effort_spotlight: {
    icon: <Star className="w-full h-full" />,
    color: '#FCEE4B',
    bgGradient: 'from-yellow-500/20 to-amber-500/20',
    label: 'Spotlight snahy',
  },
  surprise_celebration: {
    icon: <Sparkles className="w-full h-full" />,
    color: '#4AEDD9',
    bgGradient: 'from-cyan-500/20 to-teal-500/20',
    label: 'Překvapivá oslava',
  },
  milestone: {
    icon: <Trophy className="w-full h-full" />,
    color: '#FF9500',
    bgGradient: 'from-orange-500/20 to-amber-500/20',
    label: 'Milník dosažen',
  },
}

export default function RecognitionCard({
  recognition,
  onDismiss,
  showTimestamp = true,
}: RecognitionCardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const style = RECOGNITION_STYLES[recognition.recognition_type]

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss?.(recognition.id)
    }, 300)
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'právě teď'
    if (diffMins < 60) return `před ${diffMins} min`
    if (diffHours < 24) return `před ${diffHours} h`
    return `před ${diffDays} dny`
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="mc-panel mc-panel-dark overflow-hidden relative"
          style={{
            background: `linear-gradient(135deg, ${style.color}15 0%, ${style.color}05 100%)`,
            borderColor: `${style.color}30`,
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-6 h-6"
                style={{ color: style.color }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              >
                {style.icon}
              </motion.div>
              <span className="text-sm font-bold" style={{ color: style.color }}>
                {recognition.title || style.label}
              </span>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-[var(--foreground-muted)]" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: style.color }}
              />
              <p className="text-sm leading-relaxed text-white">{recognition.message}</p>
            </div>
          </div>

          {/* Footer */}
          {showTimestamp && (
            <div className="px-4 pb-3 text-xs text-[var(--foreground-muted)]">
              {timeAgo(recognition.created_at)}
            </div>
          )}

          {/* Decorative particles for celebration type */}
          {recognition.recognition_type === 'surprise_celebration' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FF6B9D', '#FCEE4B', '#4AEDD9', '#FF9500'][i % 4],
                    left: `${15 + i * 15}%`,
                    top: '10%',
                  }}
                  animate={{
                    y: [0, 100],
                    opacity: [1, 0],
                    scale: [1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Recognition list component for displaying multiple recognitions
interface RecognitionListProps {
  recognitions: Recognition[]
  onDismiss?: (id: string) => void
  maxVisible?: number
}

export function RecognitionList({
  recognitions,
  onDismiss,
  maxVisible = 3,
}: RecognitionListProps) {
  const visibleRecognitions = recognitions.slice(0, maxVisible)
  const hiddenCount = recognitions.length - maxVisible

  return (
    <div className="space-y-3">
      {visibleRecognitions.map((recognition, index) => (
        <motion.div
          key={recognition.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <RecognitionCard recognition={recognition} onDismiss={onDismiss} />
        </motion.div>
      ))}

      {hiddenCount > 0 && (
        <p className="text-center text-sm text-[var(--foreground-muted)]">
          +{hiddenCount} dalších zpráv
        </p>
      )}
    </div>
  )
}
