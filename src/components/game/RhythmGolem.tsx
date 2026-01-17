'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface RhythmGolemProps {
  learningStreak: number
  activitiesThisWeek: number
  weeklyGoal: number
  lastActivityDate: string | null
  username: string
}

type GolemMood = 'happy' | 'excited' | 'proud' | 'calm' | 'sleeping'

interface GolemState {
  mood: GolemMood
  message: string
  emoji: string
}

// Messages based on different situations
const MESSAGES = {
  // Morning greetings (before noon)
  morning: [
    'Dobré ráno! Dnešek je plný možností.',
    'Ahoj! Co nového se dnes naučíme?',
    'Krásné ráno! Jsem zvědavý, co dnes objevíš.',
  ],
  // Afternoon
  afternoon: [
    'Jak se ti daří?',
    'Odpoledne je skvělý čas na učení.',
    'Hezké odpoledne! Co máš v plánu?',
  ],
  // Evening
  evening: [
    'Hezký večer! Ještě něco stihneme?',
    'Večer je čas odpočívat, ale jestli chceš...',
    'Užij si zbytek večera!',
  ],
  // Streak messages
  streak: {
    low: [
      'Každý den, kdy se učíš, se počítá!',
      'Malé kroky vedou k velkým cílům.',
    ],
    medium: [
      'Vidím, že ti to jde! {streak} dní v řadě!',
      'Skvělá série! Buduje se ti návyk.',
      '{streak} dní učení! To je super.',
    ],
    high: [
      'Wow, {streak} dní! Jsi úžasná!',
      'Učení je součástí tvého dne! {streak} dní!',
      '{streak} dní! Tvoje odhodlání mě inspiruje.',
    ],
  },
  // Weekly goal progress
  weeklyGoal: {
    notStarted: [
      'Nový týden, nové možnosti!',
      'Máš před sebou celý týden!',
    ],
    progress: [
      'Už {count}/{goal}! Pokračuj!',
      'Jsi na dobré cestě k cíli!',
    ],
    almostDone: [
      'Už skoro tam! Zbývá jen málo!',
      'Ještě trochu a máš týdenní cíl!',
    ],
    completed: [
      'Týdenní cíl splněn! Výborně!',
      'Dokázala jsi to! Jsem na tebe hrdý.',
      'Splněno! A to ještě není konec týdne!',
    ],
  },
  // No activity today
  noActivityToday: [
    'Jak se dnes máš?',
    'Je to fajn, vzít si volno.',
    'Učení může počkat, když potřebuješ.',
  ],
  // Just completed activity
  justCompleted: [
    'Právě jsi něco dokončila! Super!',
    'Další krok na cestě za poznáním!',
    'Skvělá práce!',
  ],
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

function getGolemState(
  learningStreak: number,
  activitiesThisWeek: number,
  weeklyGoal: number,
  lastActivityDate: string | null
): GolemState {
  const today = new Date().toISOString().split('T')[0]
  const didActivityToday = lastActivityDate === today
  const timeOfDay = getTimeOfDay()

  // Determine mood
  let mood: GolemMood = 'calm'
  if (activitiesThisWeek >= weeklyGoal) {
    mood = 'proud'
  } else if (didActivityToday) {
    mood = 'excited'
  } else if (learningStreak >= 3) {
    mood = 'happy'
  } else if (timeOfDay === 'evening' && !didActivityToday) {
    mood = 'sleeping'
  }

  // Determine message
  let message = ''

  // Priority: Just completed activity today
  if (didActivityToday && activitiesThisWeek === 1) {
    message = getRandomMessage(MESSAGES.justCompleted)
  }
  // Weekly goal completed
  else if (activitiesThisWeek >= weeklyGoal) {
    message = getRandomMessage(MESSAGES.weeklyGoal.completed)
  }
  // Good streak
  else if (learningStreak >= 7) {
    message = getRandomMessage(MESSAGES.streak.high).replace('{streak}', String(learningStreak))
  } else if (learningStreak >= 3) {
    message = getRandomMessage(MESSAGES.streak.medium).replace('{streak}', String(learningStreak))
  }
  // Weekly goal progress
  else if (activitiesThisWeek > 0 && activitiesThisWeek >= weeklyGoal - 1) {
    message = getRandomMessage(MESSAGES.weeklyGoal.almostDone)
  } else if (activitiesThisWeek > 0) {
    message = getRandomMessage(MESSAGES.weeklyGoal.progress)
      .replace('{count}', String(activitiesThisWeek))
      .replace('{goal}', String(weeklyGoal))
  }
  // Default: time-based greeting
  else {
    message = getRandomMessage(MESSAGES[timeOfDay])
  }

  // Emoji based on mood
  const emojis: Record<GolemMood, string> = {
    happy: '😊',
    excited: '🎉',
    proud: '🌟',
    calm: '🙂',
    sleeping: '😴',
  }

  return {
    mood,
    message,
    emoji: emojis[mood],
  }
}

export default function RhythmGolem({
  learningStreak,
  activitiesThisWeek,
  weeklyGoal,
  lastActivityDate,
  username,
}: RhythmGolemProps) {
  const golemState = useMemo(
    () => getGolemState(learningStreak, activitiesThisWeek, weeklyGoal, lastActivityDate),
    [learningStreak, activitiesThisWeek, weeklyGoal, lastActivityDate]
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mc-panel mc-panel-dark"
    >
      <div className="flex items-start gap-4">
        {/* Golem Avatar */}
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center flex-shrink-0 border-2 border-stone-500 shadow-lg"
          animate={
            golemState.mood === 'excited'
              ? { y: [0, -4, 0] }
              : golemState.mood === 'sleeping'
              ? { rotate: [0, 3, 0, -3, 0] }
              : {}
          }
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >
          {/* Golem face */}
          <div className="relative">
            {/* Eyes */}
            <div className="flex gap-3">
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${
                  golemState.mood === 'sleeping' ? 'bg-stone-400 h-1' : 'bg-amber-400'
                }`}
                animate={
                  golemState.mood === 'happy' || golemState.mood === 'excited'
                    ? { scale: [1, 1.2, 1] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.div
                className={`w-2.5 h-2.5 rounded-full ${
                  golemState.mood === 'sleeping' ? 'bg-stone-400 h-1' : 'bg-amber-400'
                }`}
                animate={
                  golemState.mood === 'happy' || golemState.mood === 'excited'
                    ? { scale: [1, 1.2, 1] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              />
            </div>
            {/* Mouth */}
            <div
              className={`mt-2 mx-auto ${
                golemState.mood === 'proud' || golemState.mood === 'excited'
                  ? 'w-4 h-2 border-b-2 border-amber-400 rounded-b-full'
                  : golemState.mood === 'happy'
                  ? 'w-3 h-1.5 border-b-2 border-amber-400 rounded-b-lg'
                  : golemState.mood === 'sleeping'
                  ? 'w-2 h-0.5 bg-stone-400 rounded'
                  : 'w-2 h-1 border-b border-amber-400'
              }`}
            />
          </div>
        </motion.div>

        {/* Message Bubble */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-amber-400">Golem</span>
            <span className="text-lg">{golemState.emoji}</span>
          </div>
          <div className="relative bg-black/30 rounded-lg p-3 rounded-tl-none">
            {/* Bubble pointer */}
            <div className="absolute -left-2 top-0 w-0 h-0 border-t-8 border-r-8 border-t-transparent border-r-black/30" />
            <p className="text-sm text-[var(--foreground-muted)]">
              {golemState.message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
