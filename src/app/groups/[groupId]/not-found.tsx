import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function GroupNotFound() {
  return (
    <div className="flex flex-col gap-3">
      <p>No tienes acceso a este grupo o ya no está disponible.</p>
      <p>
        <Button asChild variant="secondary">
          <Link href="/groups">Volver a grupos</Link>
        </Button>
      </p>
    </div>
  )
}
