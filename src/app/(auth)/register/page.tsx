'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_THEME } from '@/lib/themes'
import { Mail, Lock, User, Loader2, ArrowLeft, Check, Users, GraduationCap } from 'lucide-react'

type UserRole = 'student' | 'parent'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
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

    if (username.length < 3) {
      setError('Přezdívka musí mít alespoň 3 znaky')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName || null,
          role: selectedRole,
          theme: DEFAULT_THEME,
        },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Tento email je již zaregistrován')
      } else {
        setError('Chyba při registraci. Zkus to znovu.')
      }
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
            Poslali jsme ti potvrzovací odkaz na <strong>{email}</strong>.
            Klikni na něj pro dokončení registrace.
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
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" />
          Zpět
        </Link>

        <h1 className="text-4xl font-bold mb-2 text-center text-[var(--color-emerald)]" style={{ textShadow: '3px 3px 0 #000' }}>
          Nový účet
        </h1>
        <p className="text-center text-[var(--foreground-muted)] mb-8">
          Připrav se na dobrodružství!
        </p>

        <form onSubmit={handleRegister} className="mc-panel mc-panel-dark space-y-4">
          {error && (
            <div className="bg-red-900/50 border-2 border-red-500 p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block mb-3 text-sm font-bold">Jsem:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'student'
                    ? 'border-[var(--color-emerald)] bg-[var(--color-emerald)]/10'
                    : 'border-[#2a2a4e] hover:border-gray-500'
                }`}
              >
                {selectedRole === 'student' && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[var(--color-emerald)]">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <GraduationCap className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'student' ? 'text-[var(--color-emerald)]' : 'text-gray-400'}`} />
                <div className={`text-sm font-bold ${selectedRole === 'student' ? 'text-[var(--color-emerald)]' : 'text-gray-400'}`}>
                  Student
                </div>
                <div className="text-xs text-[var(--foreground-muted)] mt-1">
                  Plním úkoly a sbírám odměny
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('parent')}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'parent'
                    ? 'border-[var(--color-legendary)] bg-[var(--color-legendary)]/10'
                    : 'border-[#2a2a4e] hover:border-gray-500'
                }`}
              >
                {selectedRole === 'parent' && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[var(--color-legendary)]">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <Users className={`w-8 h-8 mx-auto mb-2 ${selectedRole === 'parent' ? 'text-[var(--color-legendary)]' : 'text-gray-400'}`} />
                <div className={`text-sm font-bold ${selectedRole === 'parent' ? 'text-[var(--color-legendary)]' : 'text-gray-400'}`}>
                  Rodič
                </div>
                <div className="text-xs text-[var(--foreground-muted)] mt-1">
                  Schvaluji aktivity dětí
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm">{selectedRole === 'parent' ? 'Jméno' : 'Přezdívka'} *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)] z-10" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mc-input mc-input-icon w-full"
                placeholder={selectedRole === 'parent' ? 'Vaše jméno' : 'Tvá přezdívka'}
                required
                minLength={3}
                maxLength={20}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm">Celé jméno (volitelné)</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mc-input w-full"
              placeholder="Jan Novák"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Email *</label>
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
            <label className="block mb-2 text-sm">Heslo *</label>
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
            <label className="block mb-2 text-sm">Potvrzení hesla *</label>
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
            style={{
              background: selectedRole === 'parent'
                ? 'linear-gradient(to bottom, var(--color-legendary) 0%, #7c3aed 100%)'
                : 'linear-gradient(to bottom, var(--color-emerald) 0%, #3D8C3E 100%)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registruji...
              </>
            ) : (
              <>
                {selectedRole === 'parent' ? <Users className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />} Vytvořit účet
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-[var(--foreground-muted)]">
          Máš účet?{' '}
          <Link href="/login" className="text-[var(--color-emerald)] hover:underline">
            Přihlas se
          </Link>
        </p>
      </div>
    </main>
  )
}
