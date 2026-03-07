'use client'

import { useEffect, useState } from 'react'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

function isInstalled() {
  if (typeof window === 'undefined') return false

  const isStandaloneMode = window.matchMedia(
    '(display-mode: standalone)',
  ).matches
  const isIosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  )

  return isStandaloneMode || isIosStandalone
}

export function usePwaInstallPrompt() {
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setInstalled(isInstalled())

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent
      installEvent.preventDefault()

      if (!isInstalled()) {
        setDeferredPrompt(installEvent)
      }
    }

    const onAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }

    setDeferredPrompt(null)
    return choice.outcome === 'accepted'
  }

  return {
    canInstall: !installed && !!deferredPrompt,
    install,
  }
}
