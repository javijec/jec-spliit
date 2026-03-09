'use client'

import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import { usePwaInstallPrompt } from '@/components/use-pwa-install-prompt'

export function PwaInstallButton() {
  const pathname = usePathname()
  const { canInstall, install } = usePwaInstallPrompt()

  const isGroupMobileChromeRoute =
    /^\/groups\/[^/]+\/(summary|expenses|balances|settings)(\/.*)?$/.test(
      pathname ?? '',
    )

  if (!canInstall || isGroupMobileChromeRoute) {
    return null
  }

  return (
    <Button
      type="button"
      onClick={() => void install()}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-[70] border border-primary/10 sm:bottom-4 sm:right-4"
    >
      Instalar app
    </Button>
  )
}
