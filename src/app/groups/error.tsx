'use client'

import { RouteErrorState } from '@/components/route-feedback'

export default function GroupsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorState
      title="No se pudieron cargar tus grupos"
      description="La pantalla de grupos no pudo terminar de cargar. Probá de nuevo para recuperar la lista."
      onRetry={reset}
    />
  )
}
