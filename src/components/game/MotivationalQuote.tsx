'use client'

import { useMemo } from 'react'
import { Quote } from 'lucide-react'

interface QuoteData {
  text: string
  author: string
  source?: string
}

// Motivational quotes from respected authors - adapted for children
const QUOTES: QuoteData[] = [
  // Carol Dweck - Growth Mindset
  {
    text: 'Ještě to neumím. Ale můžu se to naučit.',
    author: 'Carol Dweck',
    source: 'Nastavení mysli',
  },
  {
    text: 'Chyby jsou důkaz, že se snažíš.',
    author: 'Carol Dweck',
    source: 'Nastavení mysli',
  },
  {
    text: 'Tvůj mozek je jako sval - čím víc ho trénuješ, tím silnější je.',
    author: 'Carol Dweck',
    source: 'Nastavení mysli',
  },
  {
    text: 'Není důležité být nejlepší, ale být lepší než včera.',
    author: 'Carol Dweck',
  },

  // Daniel Pink - Drive / Motivation
  {
    text: 'Nejlepší motivace přichází zevnitř, ne zvenku.',
    author: 'Daniel Pink',
    source: 'Drive',
  },
  {
    text: 'Když děláš něco, co tě baví, ani to není práce.',
    author: 'Daniel Pink',
    source: 'Drive',
  },
  {
    text: 'Mistrovství není cíl, ale cesta.',
    author: 'Daniel Pink',
    source: 'Drive',
  },
  {
    text: 'Skutečná odměna je radost z učení samotného.',
    author: 'Daniel Pink',
    source: 'Drive',
  },

  // Simon Sinek - Start With Why
  {
    text: 'Začni s otázkou PROČ, ne JAK.',
    author: 'Simon Sinek',
    source: 'Začni s proč',
  },
  {
    text: 'Lidé nevěří tomu, co děláš. Věří tomu, proč to děláš.',
    author: 'Simon Sinek',
  },
  {
    text: 'Sny se plní po malých krůčcích, ne velkých skocích.',
    author: 'Simon Sinek',
  },

  // Angela Duckworth - Grit
  {
    text: 'Talent je jen začátek. Důležitá je vytrvalost.',
    author: 'Angela Duckworth',
    source: 'Grit',
  },
  {
    text: 'Vášeň + vytrvalost = úspěch.',
    author: 'Angela Duckworth',
    source: 'Grit',
  },
  {
    text: 'Padnout není selhání. Selhání je zůstat ležet.',
    author: 'Angela Duckworth',
    source: 'Grit',
  },

  // James Clear - Atomic Habits
  {
    text: 'Malé změny vedou k velkým výsledkům.',
    author: 'James Clear',
    source: 'Atomové návyky',
  },
  {
    text: 'Každý den o 1% lepší - za rok budeš 37× lepší.',
    author: 'James Clear',
    source: 'Atomové návyky',
  },
  {
    text: 'Nejsi to, co říkáš. Jsi to, co děláš pravidelně.',
    author: 'James Clear',
    source: 'Atomové návyky',
  },

  // Albert Einstein
  {
    text: 'Neučím se proto, abych věděl víc, ale abych rozuměl líp.',
    author: 'Albert Einstein',
  },
  {
    text: 'Chyba je jen nový způsob, jak něco zkusit.',
    author: 'Albert Einstein',
  },

  // Other inspiring figures
  {
    text: 'Cesta tisíce mil začíná jedním krokem.',
    author: 'Lao-c\'',
  },
  {
    text: 'Dnes udělej něco, za co ti zítra poděkuješ.',
    author: 'Sean Patrick Flanery',
  },
  {
    text: 'Nikdy není pozdě být tím, kým můžeš být.',
    author: 'George Eliot',
  },
  {
    text: 'Úspěch není konečný, neúspěch není fatální. Důležitá je odvaha pokračovat.',
    author: 'Winston Churchill',
  },
]

export default function MotivationalQuote() {
  // Random quote on each render (changes on page load)
  const randomQuote = useMemo(() => {
    const index = Math.floor(Math.random() * QUOTES.length)
    return QUOTES[index]
  }, [])

  return (
    <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
      <Quote className="absolute top-3 left-3 w-5 h-5 text-purple-400/40" />
      <div className="pl-6">
        <p className="text-sm italic text-[var(--foreground)] leading-relaxed">
          "{randomQuote.text}"
        </p>
        <p className="text-xs text-[var(--foreground-muted)] mt-2">
          — {randomQuote.author}
          {randomQuote.source && (
            <span className="opacity-70">, {randomQuote.source}</span>
          )}
        </p>
      </div>
    </div>
  )
}
