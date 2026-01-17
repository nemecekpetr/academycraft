'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeId, Theme, getTheme, THEMES, DEFAULT_THEME } from '@/lib/themes'
import { createClient } from '@/lib/supabase/client'

const THEME_STORAGE_KEY = 'academycraft-theme'

interface ThemeContextType {
  theme: Theme
  themeId: ThemeId
  setThemeId: (id: ThemeId) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage (instant, no FOUC)
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved && saved in THEMES) {
        return saved as ThemeId
      }
    }
    return DEFAULT_THEME
  })
  const [isLoading, setIsLoading] = useState(true)

  // Sync with Supabase on mount (secondary source)
  useEffect(() => {
    syncThemeWithProfile()
  }, [])

  // Apply theme CSS variables whenever themeId changes
  useEffect(() => {
    const theme = getTheme(themeId)
    const root = document.documentElement
    const body = document.body

    // Colors
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-xp', theme.colors.xp)
    root.style.setProperty('--theme-currency', theme.colors.currency)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-background-light', theme.colors.backgroundLight)
    root.style.setProperty('--theme-card', theme.colors.card)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted)

    // Fonts
    root.style.setProperty('--theme-font-heading', theme.font.heading)
    root.style.setProperty('--theme-font-body', theme.font.body)

    // Apply font to body
    body.style.fontFamily = theme.font.body
    body.style.color = theme.colors.text
    body.style.backgroundColor = theme.colors.background

    // Remove background pattern for unicorn theme (light theme)
    if (themeId === 'unicorn') {
      body.style.backgroundImage = 'none'
    } else {
      body.style.backgroundImage = `
        linear-gradient(rgba(45, 45, 45, 0.95), rgba(45, 45, 45, 0.95)),
        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23555555' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V36h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
      `
    }

  }, [themeId])

  async function syncThemeWithProfile() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theme')
          .eq('id', user.id)
          .single()

        if (profile?.theme && profile.theme in THEMES) {
          const profileTheme = profile.theme as ThemeId
          // Update state and localStorage if different
          if (profileTheme !== themeId) {
            setThemeIdState(profileTheme)
            localStorage.setItem(THEME_STORAGE_KEY, profileTheme)
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync theme with profile:', error)
    }

    setIsLoading(false)
  }

  async function setThemeId(id: ThemeId) {
    // Update state immediately
    setThemeIdState(id)

    // Save to localStorage (instant on next visit)
    localStorage.setItem(THEME_STORAGE_KEY, id)

    // Save to database (persistent across devices)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ theme: id })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Failed to save theme to profile:', error)
    }
  }

  const theme = getTheme(themeId)

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
