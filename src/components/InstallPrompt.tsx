'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // Show iOS-specific prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000)
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString())
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="mc-panel mc-panel-dark border-[var(--color-emerald)]">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[var(--color-emerald)]/20 rounded flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-[var(--color-emerald)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Nainstaluj aplikaci</h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  {isIOS
                    ? 'Klepni na tlačítko Sdílet a pak "Přidat na plochu"'
                    : 'Přidej si AcademyCraft na plochu pro rychlý přístup'}
                </p>
                {!isIOS && deferredPrompt && (
                  <button
                    onClick={handleInstall}
                    className="mc-button mc-button-primary text-sm py-2 px-4"
                  >
                    Nainstalovat
                  </button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="text-[var(--foreground-muted)] hover:text-white flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
