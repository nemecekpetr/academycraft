'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface EmeraldCounterProps {
  amount: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export default function EmeraldCounter({ amount, size = 'md', animate = true }: EmeraldCounterProps) {
  const [displayAmount, setDisplayAmount] = useState(amount)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (animate && amount !== displayAmount) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayAmount(amount)
        setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setDisplayAmount(amount)
    }
  }, [amount, displayAmount, animate])

  const sizes = {
    sm: { icon: 'w-4 h-4', text: 'text-sm' },
    md: { icon: 'w-5 h-5', text: 'text-lg' },
    lg: { icon: 'w-6 h-6', text: 'text-xl' },
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`emerald-icon ${sizes[size].icon}`}
        animate={isAnimating ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.3 }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={displayAmount}
          initial={animate ? { y: -10, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`${sizes[size].text} font-bold text-[var(--color-emerald)]`}
          style={{ textShadow: '0 0 10px var(--color-emerald)' }}
        >
          {displayAmount.toLocaleString('cs-CZ')}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
