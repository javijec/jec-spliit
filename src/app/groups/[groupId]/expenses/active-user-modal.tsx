'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useMediaQuery } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { useTranslations } from 'next-intl'
import { ComponentProps, useEffect, useMemo, useState } from 'react'
import { useCurrentGroup } from '../current-group-context'

export function ActiveUserModal({
  groupId,
  open: controlledOpen,
  onOpenChange,
}: {
  groupId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const t = useTranslations('Expenses.ActiveUserModal')
  const [internalOpen, setInternalOpen] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const {
    group,
    viewer,
    currentActiveParticipantId,
  } = useCurrentGroup()
  const utils = trpc.useUtils()
  const setActiveParticipant = trpc.groups.setActiveParticipant.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.groups.get.invalidate({ groupId }),
        utils.groups.getDetails.invalidate({ groupId }),
      ])
    },
  })
  const isControlled = controlledOpen !== undefined
  const open = controlledOpen ?? internalOpen
  const setOpen = useMemo(
    () => (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  useEffect(() => {
    if (!group) return

    if (viewer) {
      if (!currentActiveParticipantId) {
        setOpen(true)
      }
      return
    }

    const tempUser = localStorage.getItem(`newGroup-activeUser`)
    const activeUser = localStorage.getItem(`${group.id}-activeUser`)
    if (!tempUser && !activeUser) {
      setOpen(true)
    }
  }, [currentActiveParticipantId, group, viewer])

  function updateOpen(open: boolean) {
    if (!group) return

    if (viewer) {
      if (!open && !currentActiveParticipantId) {
        void setActiveParticipant.mutateAsync({ groupId: group.id, participantId: null })
      }
      setOpen(open)
      return
    }

    if (!open && !localStorage.getItem(`${group.id}-activeUser`)) {
      localStorage.setItem(`${group.id}-activeUser`, 'None')
    }
    setOpen(open)
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={updateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <ActiveUserForm
            group={group}
            currentActiveParticipantId={currentActiveParticipantId}
            isAuthenticated={!!viewer}
            currentUserId={viewer?.id}
            close={() => setOpen(false)}
          />
          <DialogFooter className="sm:justify-center">
            <p className="text-sm text-center text-muted-foreground">
              {t('footer')}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={updateOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DrawerHeader>
        <ActiveUserForm
          className="px-4"
          group={group}
          currentActiveParticipantId={currentActiveParticipantId}
          isAuthenticated={!!viewer}
          currentUserId={viewer?.id}
          close={() => setOpen(false)}
        />
        <DrawerFooter className="pt-2">
          <p className="text-sm text-center text-muted-foreground">
            {t('footer')}
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function ActiveUserForm({
  group,
  currentActiveParticipantId,
  isAuthenticated,
  currentUserId,
  close,
  className,
}: ComponentProps<'form'> & {
  group?: AppRouterOutput['groups']['get']['group']
  currentActiveParticipantId?: string | null
  isAuthenticated?: boolean
  currentUserId?: string
  close: () => void
}) {
  const t = useTranslations('Expenses.ActiveUserModal')
  const utils = trpc.useUtils()
  const setActiveParticipant = trpc.groups.setActiveParticipant.useMutation()
  const [selected, setSelected] = useState('None')
  const linkedUnavailableLabel = (() => {
    const translated = t('linkedUnavailable')
    return translated === 'linkedUnavailable' ? 'Ya vinculado' : translated
  })()

  useEffect(() => {
    setSelected(currentActiveParticipantId ?? 'None')
  }, [currentActiveParticipantId])

  return (
    <form
      className={cn('grid items-start gap-4', className)}
      onSubmit={async (event) => {
        if (!group) return

        event.preventDefault()
        if (isAuthenticated) {
          await setActiveParticipant.mutateAsync({
            groupId: group.id,
            participantId: selected === 'None' ? null : selected,
          })
          await Promise.all([
            utils.groups.get.invalidate({ groupId: group.id }),
            utils.groups.getDetails.invalidate({ groupId: group.id }),
          ])
        } else {
          localStorage.setItem(`${group.id}-activeUser`, selected)
        }
        close()
      }}
    >
      <RadioGroup value={selected} onValueChange={setSelected}>
        <div className="flex flex-col gap-4 my-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="None" id="none" />
            <Label htmlFor="none" className="italic font-normal flex-1">
              {t('nobody')}
            </Label>
          </div>
          {group?.participants.map((participant: NonNullable<typeof group>['participants'][number]) => {
            const isLinkedToAnotherUser =
              !!isAuthenticated &&
              !!participant.appUserId &&
              participant.appUserId !== currentUserId

            return (
              <div key={participant.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={participant.id}
                  id={participant.id}
                  disabled={isLinkedToAnotherUser}
                />
                <Label
                  htmlFor={participant.id}
                  className={cn('flex-1', {
                    'cursor-not-allowed opacity-50': isLinkedToAnotherUser,
                  })}
                >
                  {participant.name}
                  {isLinkedToAnotherUser && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {linkedUnavailableLabel}
                    </span>
                  )}
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>
      <Button type="submit" disabled={setActiveParticipant.isPending}>
        {t('save')}
      </Button>
    </form>
  )
}
