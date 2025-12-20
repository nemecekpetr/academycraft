'use client'

import { useState } from 'react'
import { Settings, Database, Shield, Bell, Save, Loader2, RefreshCw } from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    xpPerLevel: 100,
    emeraldsPerActivity: 1,
    streakBonusMultiplier: 1.5,
    maxDailyActivities: 10,
    enableNotifications: true,
    maintenanceMode: false,
  })

  async function saveSettings() {
    setSaving(true)
    // TODO: Implement actual settings save to database
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    alert('Nastavení uloženo!')
  }

  async function clearCache() {
    if (!confirm('Opravdu chceš vymazat cache?')) return
    // TODO: Implement cache clearing
    alert('Cache vymazána!')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nastavení</h1>
        <p className="text-[var(--foreground-muted)]">
          Konfigurace systému AcademyCraft
        </p>
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
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[var(--foreground-muted)]" />
                <div>
                  <div className="text-white font-medium">Notifikace</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Povolit push notifikace
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enableNotifications ? 'bg-[var(--color-emerald)]' : 'bg-[#2a2a4e]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.enableNotifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[var(--foreground-muted)]" />
                <div>
                  <div className="text-white font-medium">Režim údržby</div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Vypnout přístup pro uživatele
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-red-500' : 'bg-[#2a2a4e]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.maintenanceMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={clearCache}
              className="w-full flex items-center justify-center gap-2 p-4 bg-[#1a1a2e] hover:bg-[#2a2a4e] rounded-lg transition-colors"
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

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-[var(--color-emerald)] hover:bg-[var(--color-emerald)]/80 text-black font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Uložit nastavení
        </button>
      </div>
    </div>
  )
}
