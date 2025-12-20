'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, User, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Hardcoded admin credentials
    if (username === 'admin' && password === 'admin') {
      // Set admin session in localStorage
      localStorage.setItem('adminAuth', JSON.stringify({
        authenticated: true,
        timestamp: Date.now()
      }))
      router.push('/admin/dashboard')
    } else {
      setError('Nesprávné přihlašovací údaje')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#1a1a2e]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[var(--color-legendary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-[var(--color-legendary)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-legendary)]">
            Admin Panel
          </h1>
          <p className="text-[var(--foreground-muted)] mt-2">
            AcademyCraft Administration
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0f0f1a] border border-[#2a2a4e] rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm text-[var(--foreground-muted)]">
              Uživatelské jméno
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--color-legendary)]"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-[var(--foreground-muted)]">
              Heslo
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4e] rounded-lg pl-12 pr-4 py-3 text-white placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--color-legendary)]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-legendary)] hover:bg-[var(--color-legendary)]/80 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Přihlásit se'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
