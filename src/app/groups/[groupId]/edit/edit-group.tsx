'use client'

import { GroupForm } from '@/components/group-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Lock, LockOpen, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { ShareButton } from '../share-button'

export const EditGroup = () => {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const [password, setPassword] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const { toast } = useToast()
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })
  const { mutateAsync: mutateGroupAsync } = trpc.groups.update.useMutation()
  const { mutateAsync: setAccessPasswordAsync, isPending: isSettingPassword } =
    trpc.groups.setAccessPassword.useMutation()
  const {
    mutateAsync: clearAccessPasswordAsync,
    isPending: isClearingPassword,
  } = trpc.groups.clearAccessPassword.useMutation()
  const { mutateAsync: deleteGroupAsync, isPending: isDeletingGroup } =
    trpc.groups.delete.useMutation()
  const utils = trpc.useUtils()
  const router = useRouter()

  const getActiveParticipantId = () => {
    const rawActiveUser = localStorage.getItem(`${groupId}-activeUser`)
    if (!rawActiveUser || !data?.group) return undefined
    const participant = data.group.participants.find(
      (item) => item.id === rawActiveUser || item.name === rawActiveUser,
    )
    return participant?.id
  }

  if (isLoading) return <></>
  const groupName = data?.group?.name ?? ''
  const canDeleteGroup =
    deleteConfirmChecked && deleteConfirmName.trim() === groupName

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="rounded-lg border bg-card/80 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-base sm:text-lg font-semibold leading-tight">
          {t('editPageTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {t('editPageDescription')}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[11px] sm:text-xs">
            {t('participantsBadge', {
              count: data?.group?.participants.length ?? 0,
            })}
          </Badge>
          {data?.group?.currencyCode && (
            <Badge variant="secondary" className="text-[11px] sm:text-xs">
              {t('defaultCurrencyLabel', {
                currencyCode: data.group.currencyCode,
              })}
            </Badge>
          )}
        </div>
        {data?.group && (
          <div className="mt-3">
            <ShareButton
              group={{ id: data.group.id, name: data.group.name }}
              showLabel
              variant="outline"
              size="default"
            />
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="order-1 lg:order-1">
          <GroupForm
            group={data?.group}
            onSubmit={async (groupFormValues, participantId) => {
              await mutateGroupAsync({
                groupId,
                participantId,
                groupFormValues,
              })
              await utils.groups.invalidate()
            }}
            protectedParticipantIds={data?.participantsWithExpenses}
          />
        </div>

        <aside className="order-2 lg:order-2 space-y-3 sm:space-y-4 lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {t('securityTitle')}
                </span>
                <Badge
                  variant={data?.hasAccessPassword ? 'default' : 'outline'}
                >
                  {data?.hasAccessPassword ? t('protected') : t('open')}
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('securityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  data?.hasAccessPassword
                    ? t('passwordPlaceholderChange')
                    : t('passwordPlaceholderSet')
                }
                minLength={4}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                        ? t('passwordUpdated')
                        : t('passwordEnabled'),
                    })
                  }}
                  disabled={isSettingPassword || password.trim().length < 4}
                  className="w-full h-11"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {data?.hasAccessPassword
                    ? t('updatePassword')
                    : t('enablePassword')}
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
                  disabled={!data?.hasAccessPassword || isClearingPassword}
                  className="w-full h-11"
                >
                  <LockOpen className="w-4 h-4 mr-2" />
                  {t('removePassword')}
                </Button>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-xs sm:text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{t('linkAccessTitle')}</p>
                <p>{t('linkAccessDescription1')}</p>
                <p>{t('linkAccessDescription2')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dangerZoneTitle')}</CardTitle>
              <CardDescription>{t('dangerZoneDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open)
                  if (!open) {
                    setDeleteConfirmChecked(false)
                    setDeleteConfirmName('')
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-11">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('deleteGroup')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
                  <DialogDescription>{t('deleteDialogDescription')}</DialogDescription>
                  <div className="space-y-3 py-2">
                    <div className="flex items-start gap-2 rounded-md border p-3 bg-muted/30">
                      <Checkbox
                        id="confirm-delete-group"
                        checked={deleteConfirmChecked}
                        onCheckedChange={(checked) =>
                          setDeleteConfirmChecked(Boolean(checked))
                        }
                      />
                      <label
                        htmlFor="confirm-delete-group"
                        className="text-sm leading-snug cursor-pointer"
                      >
                        {t('deleteConfirmCheckbox')}
                      </label>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{t('deleteConfirmLabel')}</p>
                      <Input
                        value={deleteConfirmName}
                        onChange={(event) =>
                          setDeleteConfirmName(event.target.value)
                        }
                        placeholder={groupName}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isDeletingGroup || !canDeleteGroup}
                      onClick={async () => {
                        await deleteGroupAsync({
                          groupId,
                          participantId: getActiveParticipantId(),
                        })
                        await utils.groups.invalidate()
                        toast({
                          title: t('groupDeleted'),
                        })
                        router.push('/groups')
                      }}
                      className="w-full"
                    >
                      {t('deleteForever')}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="secondary" className="w-full">
                        {t('cancel')}
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
