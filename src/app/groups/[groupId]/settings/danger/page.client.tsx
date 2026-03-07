'use client'

import { Button } from '@/components/ui/button'
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
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCurrentGroup } from '../../current-group-context'

export function DangerSettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })
  const { mutateAsync: deleteGroupAsync, isPending: isDeletingGroup } =
    trpc.groups.delete.useMutation()
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
    return <Skeleton className="h-60 w-full rounded-xl" />
  }

  const canDeleteGroup =
    deleteConfirmChecked && deleteConfirmName.trim() === data.group.name

  return (
    <GroupSectionCard className="border-destructive/30">
      <GroupSectionHeader>
        <GroupSectionTitle className="text-xl leading-none">
          {t('dangerZoneTitle')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {t('dangerZoneDescription')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent>
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
            <Button variant="destructive" className="h-11 w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('deleteGroup')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
            <DialogDescription>{t('deleteDialogDescription')}</DialogDescription>
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
                <Checkbox
                  id="confirm-delete-group"
                  checked={deleteConfirmChecked}
                  onCheckedChange={(checked) =>
                    setDeleteConfirmChecked(Boolean(checked))
                  }
                />
                <label
                  htmlFor="confirm-delete-group"
                  className="cursor-pointer text-sm leading-snug"
                >
                  {t('deleteConfirmCheckbox')}
                </label>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t('deleteConfirmLabel')}
                </p>
                <Input
                  value={deleteConfirmName}
                  onChange={(event) => setDeleteConfirmName(event.target.value)}
                  placeholder={data.group.name}
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
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
