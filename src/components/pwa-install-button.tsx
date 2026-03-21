'use client'

import { Button } from '@/components/ui/button'
import { usePwaInstallPrompt } from '@/components/use-pwa-install-prompt'
import { Download } from 'lucide-react'

export function PwaInstallButton() {
  const { canInstall, install } = usePwaInstallPrompt()
  if (!canInstall) {
    return null
  }

  return (
    <Button
      type="button"
      onClick={() => void install()}
      variant="ghost"
      size="icon"
      className="-my-3 text-muted-foreground hover:text-foreground"
      aria-label="Instalar app"
      title="Instalar app"
    >
      <Download className="h-4 w-4" />
      <span className="sr-only">Instalar app</span>
    </Button>
  )
}
