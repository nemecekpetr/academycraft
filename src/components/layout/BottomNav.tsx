'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scroll, ShoppingBag, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', icon: Home, label: 'Domů' },
    { href: '/quests', icon: Scroll, label: 'Questy' },
    { href: '/shop', icon: ShoppingBag, label: 'Obchod' },
    { href: '/profile', icon: User, label: 'Profil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t-4 border-[#3D3D3D] safe-area-pb">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? 'text-[var(--color-emerald)]'
                  : 'text-[var(--foreground-muted)] hover:text-white'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'animate-float' : ''}`} />
              <span className="text-xs mt-1">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-[var(--color-emerald)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
