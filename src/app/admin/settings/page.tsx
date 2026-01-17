'use client'

import { useState } from 'react'
import { Settings, Database, Shield, Bell, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    xpPerLevel: 100,
    emeraldsPerActivity: 1,
    streakBonusMultiplier: 1.5,
    maxDailyActivities: 10,
    enableNotifications: true,
    maintenanceMode: false,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nastavení</h1>
        <p className="text-[var(--foreground-muted)]">
          Konfigurace systému AcademyCraft
        </p>
      </div>

      {/* Development Notice */}
      <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-500 font-medium">Stránka ve vývoji</p>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Tato stránka zatím pouze zobrazuje nastavení. Změny se neukládají do databáze.
              Pro změnu nastavení kontaktuj vývojáře nebo uprav přímo v Supabase.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Game Settings */}
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-gold)]/20 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <h2 className="text-lg font-bold text-white">Herní nastavení</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                XP na level
              </label>
              <input
                type="number"
                value={settings.xpPerLevel}
                onChange={(e) => setSettings({ ...settings, xpPerLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                disabled
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Kolik XP je potřeba pro postup na další level
              </p>
            </div>

            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                Základní smaragdy za aktivitu
              </label>
              <input
                type="number"
                value={settings.emeraldsPerActivity}
                onChange={(e) => setSettings({ ...settings, emeraldsPerActivity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                Streak bonus multiplikátor
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.streakBonusMultiplier}
                onChange={(e) => setSettings({ ...settings, streakBonusMultiplier: parseFloat(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                disabled
              />
              <p className="text-xs text-[var(--foreground-muted)] mt-1">
                Násobitel XP bonusu za streak
              </p>
            </div>

            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-2">
                Max denních aktivit
              </label>
              <input
                type="number"
                value={settings.maxDailyActivities}
                onChange={(e) => setSettings({ ...settings, maxDailyActivities: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg text-white focus:border-[var(--color-legendary)] focus:outline-none"
                disabled
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-legendary)]/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--color-legendary)]" />
            </div>
            <h2 className="text-lg font-bold text-white">Systémové nastavení</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
                <div>
                  <div className="text-white font-medium">Notifikace</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Povolit push notifikace
                  </div>
                </div>
              </div>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors cursor-not-allowed ${
                  settings.enableNotifications ? 'bg-[var(--color-emerald)]' : 'bg-[#2a2a4e]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.enableNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[var(--foreground-muted)]" />
                <div>
                  <div className="text-white font-medium">Režim údržby</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Vypnout přístup pro uživatele
                  </div>
                </div>
              </div>
              <div
                className={`relative w-12 h-6 rounded-full transition-colors cursor-not-allowed ${
                  settings.maintenanceMode ? 'bg-red-500' : 'bg-[#2a2a4e]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>

            <button
              disabled
              className="w-full flex items-center justify-center gap-2 p-4 bg-[#1a1a2e] rounded-lg opacity-60 cursor-not-allowed"
            >
              <RefreshCw className="w-5 h-5" />
              Vymazat cache
            </button>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--color-rare)]/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-[var(--color-rare)]" />
            </div>
            <h2 className="text-lg font-bold text-white">Informace o databázi</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-[#1a1a2e] rounded-lg">
              <div className="text-2xl font-bold text-white">Supabase</div>
              <div className="text-xs text-[var(--foreground-muted)]">Databáze</div>
            </div>
            <div className="p-4 bg-[#1a1a2e] rounded-lg">
              <div className="text-2xl font-bold text-[var(--color-emerald)]">OK</div>
              <div className="text-xs text-[var(--foreground-muted)]">Stav připojení</div>
            </div>
            <div className="p-4 bg-[#1a1a2e] rounded-lg">
              <div className="text-2xl font-bold text-white">PostgreSQL</div>
              <div className="text-xs text-[var(--foreground-muted)]">Engine</div>
            </div>
            <div className="p-4 bg-[#1a1a2e] rounded-lg">
              <div className="text-2xl font-bold text-white">RLS</div>
              <div className="text-xs text-[var(--foreground-muted)]">Row Level Security</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
