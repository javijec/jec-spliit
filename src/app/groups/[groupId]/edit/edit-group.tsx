'use client'

import { GroupForm } from '@/components/group-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Lock, LockOpen, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useCurrentGroup } from '../current-group-context'

export const EditGroup = () => {
  const { groupId } = useCurrentGroup()
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })
  const { mutateAsync: mutateGroupAsync } = trpc.groups.update.useMutation()
  const { mutateAsync: setAccessPasswordAsync, isPending: isSettingPassword } =
    trpc.groups.setAccessPassword.useMutation()
  const {
    mutateAsync: clearAccessPasswordAsync,
    isPending: isClearingPassword,
  } = trpc.groups.clearAccessPassword.useMutation()
  const utils = trpc.useUtils()

  const getActiveParticipantId = () => {
    const rawActiveUser = localStorage.getItem(`${groupId}-activeUser`)
    if (!rawActiveUser || !data?.group) return undefined
    const participant = data.group.participants.find(
      (item) => item.id === rawActiveUser || item.name === rawActiveUser,
    )
    return participant?.id
  }

  if (isLoading) return <></>

  return (
    <>
      <GroupForm
        group={data?.group}
        onSubmit={async (groupFormValues, participantId) => {
          await mutateGroupAsync({ groupId, participantId, groupFormValues })
          await utils.groups.invalidate()
        }}
        protectedParticipantIds={data?.participantsWithExpenses}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Seguridad del grupo
          </CardTitle>
          <CardDescription>
            Protege este grupo con contraseña para que el enlace no alcance por
            sí solo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              data?.hasAccessPassword
                ? 'Cambiar contraseña (mínimo 4 caracteres)'
                : 'Definir contraseña (mínimo 4 caracteres)'
            }
            minLength={4}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={async () => {
                if (password.trim().length < 4) return
                await setAccessPasswordAsync({
                  groupId,
                  password,
                  participantId: getActiveParticipantId(),
                })
                setPassword('')
                await utils.groups.getDetails.invalidate({ groupId })
                toast({
                  title: data?.hasAccessPassword
                    ? 'Contraseña actualizada'
                    : 'Contraseña activada',
                })
              }}
              disabled={isSettingPassword || password.trim().length < 4}
            >
              <Lock className="w-4 h-4 mr-2" />
              {data?.hasAccessPassword ? 'Actualizar' : 'Activar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await clearAccessPasswordAsync({
                  groupId,
                  participantId: getActiveParticipantId(),
                })
                setPassword('')
                await utils.groups.getDetails.invalidate({ groupId })
                toast({
                  title: 'Contraseña eliminada',
                })
              }}
              disabled={!data?.hasAccessPassword || isClearingPassword}
            >
              <LockOpen className="w-4 h-4 mr-2" />
              Desactivar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
