'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Chyba při odesílání emailu. Zkus to znovu.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="mc-panel mc-panel-dark max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-4 text-[var(--color-emerald)]">
            Zkontroluj svůj email!
          </h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            Poslali jsme ti odkaz pro obnovení hesla na <strong>{email}</strong>.
          </p>
          <Link href="/login">
            <button className="mc-button mc-button-primary">
              Zpět na přihlášení
            </button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Zpět na přihlášení
        </Link>

        <h1 className="text-4xl font-bold mb-2 text-center text-[var(--color-emerald)]" style={{ textShadow: '3px 3px 0 #000' }}>
          Zapomenuté heslo
        </h1>
        <p className="text-center text-[var(--foreground-muted)] mb-8">
          Zadej svůj email a pošleme ti odkaz pro obnovení hesla.
        </p>

        <form onSubmit={handleSubmit} className="mc-panel mc-panel-dark space-y-4">
          {error && (
            <div className="bg-red-900/50 border-2 border-red-500 p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mc-input mc-input-icon w-full"
                placeholder="tvuj@email.cz"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mc-button mc-button-primary w-full text-lg py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Odesílám...
              </>
            ) : (
              'Obnovit heslo'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
