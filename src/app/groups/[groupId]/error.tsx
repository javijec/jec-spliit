'use client'

import { RouteErrorState } from '@/components/route-feedback'

export default function GroupError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-2">
      <RouteErrorState
        title="No se pudo abrir este grupo"
        description="Falló la carga del grupo o de alguno de sus datos principales. Reintentá para volver al estado normal."
        backLabel="Volver a mis grupos"
        onRetry={reset}
      />
    </div>
  )
}
