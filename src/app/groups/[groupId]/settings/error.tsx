'use client'

import { RouteErrorState } from '@/components/route-feedback'

export default function GroupSettingsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorState
      title="No se pudo cargar la configuración"
      description="La pantalla de ajustes del grupo no respondió como esperábamos. Probá nuevamente."
      onRetry={reset}
    />
  )
}
