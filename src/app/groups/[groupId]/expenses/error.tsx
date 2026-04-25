'use client'

import { RouteErrorState } from '@/components/route-feedback'

export default function GroupExpensesError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorState
      title="No se pudieron cargar los gastos"
      description="La sección de gastos falló durante la carga. Reintentá para recuperar la lista y las acciones disponibles."
      onRetry={reset}
    />
  )
}
