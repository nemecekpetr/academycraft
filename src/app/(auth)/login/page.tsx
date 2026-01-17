'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Check for callback error in URL params
  const errorParam = searchParams.get('error')
  const initialError = errorParam === 'auth_callback_error'
    ? 'Přihlášení se nezdařilo. Zkus to prosím znovu.'
    : null
  const [error, setError] = useState<string | null>(initialError)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Nesprávný email nebo heslo')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        Zpět
      </Link>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2 text-center text-[var(--color-emerald)]" style={{ textShadow: '3px 3px 0 #000' }}>
        Přihlášení
      </h1>
      <p className="text-center text-[var(--foreground-muted)] mb-8">
        Vítej zpět, dobrodruhu!
      </p>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="mc-panel mc-panel-dark space-y-4">
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

        <div>
          <label className="block mb-2 text-sm">Heslo</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] z-10" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Přihlašuji...
            </>
          ) : (
            'Přihlásit se'
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center mt-6 text-[var(--foreground-muted)]">
        Nemáš účet?{' '}
        <Link href="/register" className="text-[var(--color-emerald)] hover:underline">
          Zaregistruj se
        </Link>
      </p>

      {/* Forgot password */}
      <p className="text-center mt-2">
        <Link href="/forgot-password" className="text-sm text-[var(--foreground-muted)] hover:text-white">
          Zapomenuté heslo?
        </Link>
      </p>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-emerald)]" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
