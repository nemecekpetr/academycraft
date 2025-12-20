'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e]">
      <div className="animate-spin w-8 h-8 border-4 border-[var(--color-legendary)] border-t-transparent rounded-full" />
    </div>
  )
}
