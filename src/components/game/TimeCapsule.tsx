'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Calendar, Send, Sparkles, Heart, Target, Lightbulb } from 'lucide-react'
import type { TimeCapsule as TimeCapsuleType } from '@/types/database'

interface TimeCapsuleProps {
  capsule: TimeCapsuleType | null
  onCreateCapsule: (data: {
    message: string
    goals: string | null
    fears: string | null
    excitement: string | null
    unlock_date: string
  }) => Promise<void>
  onUnlockCapsule: () => Promise<void>
  onAddReflection: (reflection: string) => Promise<void>
}

export default function TimeCapsule({
  capsule,
  onCreateCapsule,
  onUnlockCapsule,
  onAddReflection,
}: TimeCapsuleProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [goals, setGoals] = useState('')
  const [fears, setFears] = useState('')
  const [excitement, setExcitement] = useState('')
  const [unlockMonths, setUnlockMonths] = useState(6)
  const [reflection, setReflection] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)

  // Calculate if capsule can be unlocked
  const canUnlock = capsule && capsule.is_locked && new Date(capsule.unlock_date) <= new Date()
  const daysUntilUnlock = capsule?.is_locked
    ? Math.max(0, Math.ceil((new Date(capsule.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const handleCreate = async () => {
    if (!message.trim()) return
    setLoading(true)

    const unlockDate = new Date()
    unlockDate.setMonth(unlockDate.getMonth() + unlockMonths)

    await onCreateCapsule({
      message: message.trim(),
      goals: goals.trim() || null,
      fears: fears.trim() || null,
      excitement: excitement.trim() || null,
      unlock_date: unlockDate.toISOString().split('T')[0],
    })

    setLoading(false)
    setIsCreating(false)
    setMessage('')
    setGoals('')
    setFears('')
    setExcitement('')
  }

  const handleUnlock = async () => {
    setLoading(true)
    await onUnlockCapsule()
    setLoading(false)
    setShowContent(true)
  }

  const handleReflection = async () => {
    if (!reflection.trim()) return
    setLoading(true)
    await onAddReflection(reflection.trim())
    setLoading(false)
    setReflection('')
  }

  // No capsule - show create option
  if (!capsule) {
    return (
      <div className="mc-panel mc-panel-dark">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Časová kapsle</h2>
          <p className="text-[var(--foreground-muted)] mb-4 text-sm">
            Napiš dopis sobě do budoucnosti. Otevřeš ho, až budeš starší!
          </p>

          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.button
                key="create-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreating(true)}
                className="mc-button mc-button-primary"
              >
                Vytvořit kapsli
              </motion.button>
            ) : (
              <motion.div
                key="create-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-left space-y-4"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Zpráva pro sebe
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mc-input w-full h-24 resize-none"
                    placeholder="Milá budoucí já, ..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Co chci dokázat?
                  </label>
                  <textarea
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className="mc-input w-full h-16 resize-none"
                    placeholder="Moje cíle..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Na co se těším?
                  </label>
                  <textarea
                    value={excitement}
                    onChange={(e) => setExcitement(e.target.value)}
                    className="mc-input w-full h-16 resize-none"
                    placeholder="Těším se na..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Lightbulb className="w-4 h-4 text-orange-400" />
                    Čeho se trochu bojím?
                  </label>
                  <textarea
                    value={fears}
                    onChange={(e) => setFears(e.target.value)}
                    className="mc-input w-full h-16 resize-none"
                    placeholder="Je normální se něčeho bát..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    Kdy se kapsle otevře?
                  </label>
                  <div className="flex gap-2">
                    {[3, 6, 12].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setUnlockMonths(months)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          unlockMonths === months
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-[var(--foreground-muted)] hover:bg-black/50'
                        }`}
                      >
                        {months} {months === 12 ? 'rok' : 'měsíců'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="mc-button flex-1"
                    disabled={loading}
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!message.trim() || loading}
                    className="mc-button mc-button-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Ukládám...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Uzamknout
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Locked capsule
  if (capsule.is_locked) {
    return (
      <div className="mc-panel mc-panel-dark">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center relative"
            animate={canUnlock ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {canUnlock ? (
              <Unlock className="w-10 h-10 text-purple-400" />
            ) : (
              <Lock className="w-10 h-10 text-purple-400" />
            )}
            {canUnlock && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-400"
                animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>

          <h2 className="text-xl font-bold mb-2">Tvoje časová kapsle</h2>

          {canUnlock ? (
            <>
              <p className="text-[var(--color-emerald)] mb-4">
                Kapsle je připravena k otevření!
              </p>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="mc-button mc-button-primary flex items-center gap-2 mx-auto"
              >
                <Unlock className="w-4 h-4" />
                {loading ? 'Odemykám...' : 'Otevřít kapsli'}
              </button>
            </>
          ) : (
            <>
              <p className="text-[var(--foreground-muted)] mb-2">
                Kapsle se otevře za
              </p>
              <p className="text-2xl font-bold text-purple-400 mb-2">
                {daysUntilUnlock} {daysUntilUnlock === 1 ? 'den' : daysUntilUnlock < 5 ? 'dny' : 'dní'}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {new Date(capsule.unlock_date).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  // Unlocked capsule - show content
  return (
    <div className="mc-panel mc-panel-dark">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold mb-1">Časová kapsle otevřena!</h2>
        <p className="text-xs text-[var(--foreground-muted)]">
          Vytvořena {new Date(capsule.created_at).toLocaleDateString('cs-CZ')}
        </p>
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-black/30 rounded-lg">
              <div className="flex items-center gap-2 text-pink-400 text-sm font-medium mb-2">
                <Heart className="w-4 h-4" />
                Zpráva pro sebe
              </div>
              <p className="text-white whitespace-pre-wrap">{capsule.message}</p>
            </div>

            {capsule.goals && (
              <div className="p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-2">
                  <Target className="w-4 h-4" />
                  Co jsem chtěla dokázat
                </div>
                <p className="text-white whitespace-pre-wrap">{capsule.goals}</p>
              </div>
            )}

            {capsule.excitement && (
              <div className="p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                  <Sparkles className="w-4 h-4" />
                  Na co jsem se těšila
                </div>
                <p className="text-white whitespace-pre-wrap">{capsule.excitement}</p>
              </div>
            )}

            {capsule.fears && (
              <div className="p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-medium mb-2">
                  <Lightbulb className="w-4 h-4" />
                  Čeho jsem se bála
                </div>
                <p className="text-white whitespace-pre-wrap">{capsule.fears}</p>
              </div>
            )}

            {/* Reflection section */}
            {capsule.reflection ? (
              <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <div className="text-sm font-medium text-purple-400 mb-2">
                  Moje reflexe
                </div>
                <p className="text-white whitespace-pre-wrap">{capsule.reflection}</p>
              </div>
            ) : (
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <label className="text-sm font-medium text-purple-400 mb-2 block">
                  Co si myslím teď?
                </label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="mc-input w-full h-20 resize-none mb-3"
                  placeholder="Jak se cítím po přečtení? Splnila jsem cíle?"
                />
                <button
                  onClick={handleReflection}
                  disabled={!reflection.trim() || loading}
                  className="mc-button mc-button-primary w-full"
                >
                  {loading ? 'Ukládám...' : 'Uložit reflexi'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!showContent && (
        <button
          onClick={() => setShowContent(true)}
          className="mc-button mc-button-primary w-full"
        >
          Zobrazit obsah kapsle
        </button>
      )}
    </div>
  )
}
