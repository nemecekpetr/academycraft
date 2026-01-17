'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  // Track if token was validated by auth state change
  const tokenValidatedRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes - Supabase will process the recovery token from URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery token is valid, user can reset password
        tokenValidatedRef.current = true
        setValidToken(true)
      } else if (event === 'SIGNED_IN' && session) {
        // User already has a valid session (e.g., came back to page)
        tokenValidatedRef.current = true
        setValidToken(true)
      }
    })

    // Also check for existing session after a delay (for URL hash processing)
    async function checkExistingSession() {
      // Give Supabase a moment to process URL hash token
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session: sessionAfterDelay } } = await supabase.auth.getSession()

      if (sessionAfterDelay) {
        tokenValidatedRef.current = true
        setValidToken(true)
      } else if (!tokenValidatedRef.current) {
        // No session established after delay - invalid token
        setValidToken(false)
      }
    }

    checkExistingSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Hesla se neshodují')
      return
    }

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      console.error('Password reset error:', error)
      if (error.message.includes('session')) {
        setError('Odkaz pro obnovení hesla vypršel. Požádej o nový.')
      } else {
        setError('Chyba při změně hesla. Zkus to znovu.')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  // Loading state while checking token
  if (validToken === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-emerald)]" />
      </main>
    )
  }

  // Invalid or missing token
  if (validToken === false) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="mc-panel mc-panel-dark max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Neplatný odkaz
          </h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            Odkaz pro obnovení hesla je neplatný nebo vypršel. Požádej o nový odkaz.
          </p>
          <Link href="/forgot-password">
            <button className="mc-button mc-button-primary">
              Požádat o nový odkaz
            </button>
          </Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="mc-panel mc-panel-dark max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4 text-[var(--color-emerald)]">
            Heslo změněno!
          </h1>
          <p className="text-[var(--foreground-muted)] mb-6">
            Tvoje heslo bylo úspěšně změněno. Nyní se můžeš přihlásit.
          </p>
          <Link href="/login">
            <button className="mc-button mc-button-primary">
              Přihlásit se
            </button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold mb-2 text-center text-[var(--color-emerald)]" style={{ textShadow: '3px 3px 0 #000' }}>
          Nové heslo
        </h1>
        <p className="text-center text-[var(--foreground-muted)] mb-8">
          Zadej své nové heslo.
        </p>

        <form onSubmit={handleSubmit} className="mc-panel mc-panel-dark space-y-4">
          {error && (
            <div className="bg-red-900/50 border-2 border-red-500 p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm">Nové heslo</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] z-10" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mc-input mc-input-icon w-full"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Alespoň 8 znaků
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm">Potvrzení hesla</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] z-10" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mc-input mc-input-icon w-full"
                placeholder="••••••••"
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
                Ukládám...
              </>
            ) : (
              'Změnit heslo'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}
