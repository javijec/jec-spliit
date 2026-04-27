'use client'

import ExportButton from '@/app/groups/[groupId]/export-button'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
import { Badge } from '@/components/ui/badge'
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
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import {
  ArrowLeft,
  ChevronRight,
  FileOutput,
  Info,
  Lock,
  LockOpen,
  Pencil,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { EditGroup } from '../edit/edit-group'

type SettingsView = 'hub' | 'edit' | 'share' | 'security' | 'danger'

function SettingsOptionCard({
  onClick,
  icon: Icon,
  title,
  description,
  selected = false,
  destructive = false,
}: {
  onClick: () => void
  icon: typeof Pencil
  title: string
  description: string
  selected?: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-start justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-4 text-left shadow-sm shadow-black/5 transition-colors hover:bg-muted/25',
        selected ? 'border-foreground/15 bg-muted/30' : '',
        destructive ? 'border-destructive/30' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background',
            destructive
              ? 'border-destructive/30 text-destructive'
              : 'text-primary',
          ].join(' ')}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{title}</p>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  )
}

export function SettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const [view, setView] = useState<SettingsView>('hub')
  const [password, setPassword] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const { data, isLoading } = trpc.groups.getDetails.useQuery(
    { groupId },
    {
      staleTime: 5 * 60 * 1000,
    },
  )
  const { mutateAsync: setAccessPasswordAsync, isPending: isSettingPassword } =
    trpc.groups.setAccessPassword.useMutation()
  const {
    mutateAsync: clearAccessPasswordAsync,
    isPending: isClearingPassword,
  } = trpc.groups.clearAccessPassword.useMutation()
  const { mutateAsync: deleteGroupAsync, isPending: isDeletingGroup } =
    trpc.groups.delete.useMutation()
  const utils = trpc.useUtils()

  const getActiveParticipantId = () => data?.currentActiveParticipantId ?? undefined

  if (isLoading || !data?.group) {
    return (
      <div className="space-y-4">
        <div className="border bg-card p-5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-28 rounded-sm" />
            <Skeleton className="h-6 w-20 rounded-sm" />
            <Skeleton className="h-6 w-24 rounded-sm" />
          </div>
          <Skeleton className="mt-4 h-7 w-40 rounded-sm" />
          <Skeleton className="mt-3 h-4 w-64 rounded-sm" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
        </div>
      </div>
    )
  }

  const canDeleteGroup =
    deleteConfirmChecked && deleteConfirmName.trim() === data.group.name

  return (
    <div className="space-y-4">
      {view === 'hub' && (
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('title')}
              description={t('hubDescription')}
              meta={
                <>
                  <Badge variant="outline">
                    {t('participantsBadge', {
                      count: data.group.participants.length,
                    })}
                  </Badge>
                  {data.group.currencyCode ? (
                    <Badge variant="outline">{data.group.currencyCode}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {data.hasAccessPassword ? t('protected') : t('open')}
                  </Badge>
                </>
              }
            />
          </GroupSectionHeader>
        </GroupSectionCard>
      )}

      {view === 'hub' ? (
        <div className="space-y-3">
          <SettingsOptionCard
            onClick={() => setView('edit')}
            icon={Pencil}
            title={t('editGroup')}
            description={t('editGroupShort')}
          />
          <SettingsOptionCard
            onClick={() => setView('share')}
            icon={FileOutput}
            title={t('shareAndExport')}
            description={t('shareAndExportShort')}
          />
          <SettingsOptionCard
            onClick={() => setView('security')}
            icon={ShieldCheck}
            title={t('securityTitle')}
            description={t('securityShort')}
          />
          <SettingsOptionCard
            onClick={() => setView('danger')}
            icon={Trash2}
            title={t('dangerZoneTitle')}
            description={t('dangerZoneShort')}
            destructive
          />
        </div>
      ) : (
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => setView('hub')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToSettings')}
          </Button>
        </div>
      )}

      {view === 'edit' && <EditGroup groupDetails={data} />}

      {view === 'share' && (
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('shareAndExport')}
              description={t('shareAndExportDescription')}
            />
          </GroupSectionHeader>
          <GroupSectionContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <ShareButton
                group={{ id: data.group.id, name: data.group.name }}
                showLabel
                size="default"
                variant="outline"
                className="w-full justify-center sm:w-auto"
              />
              <ExportButton
                groupId={groupId}
                showLabel
                size="default"
                variant="outline"
              />
            </div>

            <div className="rounded-lg border border-border/70 bg-background p-3.5 text-sm shadow-sm shadow-black/5">
              <div className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4" />
                {t('groupInformationTitle')}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {data.group.information?.trim() || t('emptyInformation')}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-background p-3.5 text-sm shadow-sm shadow-black/5">
              <div className="flex items-center gap-2 font-medium">
                <FileOutput className="h-4 w-4" />
                {t('exportInfoTitle')}
              </div>
              <p className="mt-2 text-muted-foreground">
                {t('exportInfoDescription')}
              </p>
            </div>
          </GroupSectionContent>
        </GroupSectionCard>
      )}

      {view === 'security' && (
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('securityTitle')}
              description={t('securityDescription')}
              meta={
                <Badge variant="outline">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('securityTitle')}
                </Badge>
              }
            />
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

            <div className="rounded-lg border border-border/70 bg-background p-3.5 text-sm text-muted-foreground shadow-sm shadow-black/5">
              {t('linkAccessDescription1')} {t('linkAccessDescription2')}
            </div>
          </GroupSectionContent>
        </GroupSectionCard>
      )}

      {view === 'danger' && (
        <GroupSectionCard className="border-destructive/30">
          <GroupSectionHeader>
            <SectionHeader
              title={t('dangerZoneTitle')}
              description={t('dangerZoneDescription')}
            />
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
                <div className="space-y-1 pr-8">
                  <DialogTitle>{t('deleteDialogTitle')}</DialogTitle>
                  <DialogDescription>{t('deleteDialogDescription')}</DialogDescription>
                </div>
                <div className="space-y-3 py-2">
                  <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-background p-3.5">
                    <Checkbox
                      id="confirm-delete-group"
                      checked={deleteConfirmChecked}
                      onCheckedChange={(checked) =>
                        setDeleteConfirmChecked(Boolean(checked))
                      }
                    />
                    <label
                      htmlFor="confirm-delete-group"
                      className="cursor-pointer text-sm leading-6"
                    >
                      {t('deleteConfirmCheckbox')}
                    </label>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
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
                      setDeleteDialogOpen(false)
                      setDeleteConfirmChecked(false)
                      setDeleteConfirmName('')
                      toast({
                        title: t('groupDeleted'),
                      })
                      router.replace('/groups')
                      void utils.groups.mine.invalidate()
                    }}
                    className="w-full"
                  >
                    {t('deleteForever')}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full">
                      {t('cancel')}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </GroupSectionContent>
        </GroupSectionCard>
      )}
    </div>
  )
}
