'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { THEMES, ThemeId, getThemeLevels } from '@/lib/themes'
import {
  Settings,
  Palette,
  Check,
  Loader2,
  Bell,
  Shield,
  HelpCircle
} from 'lucide-react'

export default function SettingsPage() {
  const { theme, themeId, setThemeId } = useTheme()
  const [savingTheme, setSavingTheme] = useState(false)

  async function handleThemeChange(newThemeId: ThemeId) {
    if (newThemeId === themeId) return

    setSavingTheme(true)
    await setThemeId(newThemeId)
    setSavingTheme(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3" style={{ color: theme.colors.text }}>
        <Settings className="w-8 h-8" style={{ color: theme.colors.primary }} />
        Nastavení
      </h1>

      {/* Theme Selector */}
      <div
        className="border-2 rounded-xl p-6 mb-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Palette className="w-5 h-5" style={{ color: theme.colors.primary }} />
          Vzhled aplikace
          {savingTheme && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        </h3>
        <p className="text-sm mb-4" style={{ color: theme.colors.textMuted }}>
          Vyber si styl, který ti nejvíc vyhovuje
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.values(THEMES) as typeof THEMES[ThemeId][]).map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              disabled={savingTheme}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                themeId === t.id
                  ? 'border-white scale-105'
                  : 'border-transparent hover:border-gray-600'
              }`}
              style={{
                backgroundColor: t.colors.card,
              }}
            >
              {themeId === t.id && (
                <div
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: t.colors.primary }}
                >
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-bold text-sm" style={{ color: t.colors.primary }}>
                {t.name}
              </div>
              <div className="text-xs mt-1" style={{ color: t.colors.textMuted }}>
                {t.description}
              </div>
              {/* Preview of levels */}
              <div className="flex justify-center gap-1 mt-2">
                {getThemeLevels(t.id).slice(0, 3).map((lvl) => (
                  <span key={lvl.level} className="text-sm">{lvl.icon}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications - placeholder for future */}
      <div
        className="border-2 rounded-xl p-6 mb-6 opacity-50"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <Bell className="w-5 h-5" style={{ color: theme.colors.textMuted }} />
          Oznámení
        </h3>
        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
          Brzy dostupné
        </p>
      </div>

      {/* Help - placeholder */}
      <div
        className="border-2 rounded-xl p-6"
        style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.backgroundLight }}
      >
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: theme.colors.text }}>
          <HelpCircle className="w-5 h-5" style={{ color: theme.colors.primary }} />
          Nápověda
        </h3>
        <p className="text-sm" style={{ color: theme.colors.textMuted }}>
          Máš nějaký problém? Zeptej se rodiče nebo učitele.
        </p>
      </div>
    </div>
  )
}
