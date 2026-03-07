'use client'

import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Lock, LockOpen, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCurrentGroup } from '../../current-group-context'

export function SecuritySettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const [password, setPassword] = useState('')
  const { toast } = useToast()
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })
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

  if (isLoading || !data?.group) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }

  return (
    <GroupSectionCard>
      <GroupSectionHeader>
        <GroupSectionTitle className="flex items-center gap-2 text-xl leading-none">
          <ShieldCheck className="h-5 w-5" />
          {t('securityTitle')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {t('securityDescription')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent className="space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={
            data.hasAccessPassword
              ? t('passwordPlaceholderChange')
              : t('passwordPlaceholderSet')
          }
          minLength={4}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                title: data.hasAccessPassword
                  ? t('passwordUpdated')
                  : t('passwordEnabled'),
              })
            }}
            disabled={isSettingPassword || password.trim().length < 4}
            className="h-11 w-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {data.hasAccessPassword ? t('updatePassword') : t('enablePassword')}
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
                title: t('passwordRemoved'),
              })
            }}
            disabled={!data.hasAccessPassword || isClearingPassword}
            className="h-11 w-full"
          >
            <LockOpen className="mr-2 h-4 w-4" />
            {t('removePassword')}
          </Button>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
          {t('linkAccessDescription1')} {t('linkAccessDescription2')}
        </div>
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
