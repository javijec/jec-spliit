'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

type Props = {
  groupId: string
  groupName: string
}

export function UnlockGroupClient({ groupId, groupName }: Props) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password.trim().length) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!response.ok) {
        throw new Error('Clave incorrecta.')
      }
      router.replace(`/groups/${groupId}/expenses`)
      router.refresh()
    } catch (error) {
      toast({
        title: 'No se pudo desbloquear el grupo',
        description:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al validar la contraseña.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-1 w-full max-w-screen-sm mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Grupo protegido
          </CardTitle>
          <CardDescription>
            Ingresa la contraseña para acceder a <strong>{groupName}</strong>.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña del grupo"
              autoComplete="current-password"
              required
              minLength={4}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || password.length < 4}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Desbloquear'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
