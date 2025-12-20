'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'icon' | 'full'
}

export default function LogoutButton({ variant = 'icon' }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="p-2 text-[var(--foreground-muted)] hover:text-white transition-colors"
        title="Odhlásit se"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LogOut className="w-5 h-5" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="mc-button w-full flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <LogOut className="w-5 h-5" />
          Odhlásit se
        </>
      )}
    </button>
  )
}
