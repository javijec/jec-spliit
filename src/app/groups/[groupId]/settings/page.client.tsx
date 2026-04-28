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
import { getCurrency } from '@/lib/currency'
import type { GroupFormValues } from '@/lib/schemas'
import { trpc } from '@/trpc/client'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileOutput,
  Link2,
  MailPlus,
  Plus,
  Pencil,
  ShieldCheck,
  Trash2,
  UserMinus,
  Users,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { EditGroup } from '../edit/edit-group'

type SettingsView =
  | 'hub'
  | 'edit'
  | 'participants'
  | 'export'
  | 'danger'

type ParticipantRow = {
  id: string
  name: string
  appUserId: string | null
  appUser?: {
    email?: string | null
    displayName?: string | null
  } | null
}

function buildGroupFormValues(
  group: {
    name: string
    information: string | null
    currency: string | null
    currencyCode: string | null
  },
  participants: Array<{ id?: string; name: string }>,
): GroupFormValues {
  return {
    name: group.name,
    information: group.information ?? '',
    currency:
      group.currency ??
      getCurrency(group.currencyCode ?? process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE ?? 'USD')
        .symbol,
    currencyCode: group.currencyCode ?? '',
    participants,
  }
}

function ParticipantsManager({
  canManageMembers,
  currentActiveParticipantId,
  group,
  isAddingMember,
  isUpdatingGroup,
  onAssignParticipantAccess,
  onAddParticipant,
  onDeleteParticipant,
  onEditParticipant,
  onRemoveParticipantAccess,
  participantAccess,
  protectedParticipantIds,
  removeAccessLabel,
  removingAccessUserId,
}: {
  canManageMembers: boolean
  currentActiveParticipantId: string | null
  group: {
    participants: ParticipantRow[]
  }
  isAddingMember: boolean
  isUpdatingGroup: boolean
  onAssignParticipantAccess: (participantId: string, email: string) => Promise<void>
  onAddParticipant: (name: string) => Promise<void>
  onDeleteParticipant: (participantId: string) => Promise<void>
  onEditParticipant: (participantId: string, name: string) => Promise<void>
  onRemoveParticipantAccess: (participantId: string, userId: string) => Promise<void>
  participantAccess: Record<
    string,
    {
      userId: string
      label: string
      secondary?: string | null
      isOwner?: boolean
      isCurrentViewer?: boolean
    }
  >
  protectedParticipantIds: Set<string>
  removeAccessLabel: string
  removingAccessUserId: string | null
}) {
  const t = useTranslations('Settings')
  const [newParticipantName, setNewParticipantName] = useState('')
  const [editingParticipant, setEditingParticipant] = useState<ParticipantRow | null>(null)
  const [editingName, setEditingName] = useState('')
  const [assigningParticipant, setAssigningParticipant] = useState<ParticipantRow | null>(
    null,
  )
  const [assignEmail, setAssignEmail] = useState('')

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{t('participantsAndAccessListTitle')}</p>
        <span className="text-xs text-muted-foreground">
          {t('participantsBadge', { count: group.participants.length })}
        </span>
      </div>

      <Dialog
        open={editingParticipant !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingParticipant(null)
            setEditingName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-1 pr-8">
            <DialogTitle>{t('participantEditTitle')}</DialogTitle>
            <DialogDescription>{t('participantEditDescription')}</DialogDescription>
          </div>
          <Input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            placeholder={t('participantNamePlaceholder')}
            autoFocus
          />
          <DialogFooter className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={isUpdatingGroup || editingName.trim().length < 2}
              onClick={async () => {
                if (!editingParticipant) return
                await onEditParticipant(editingParticipant.id, editingName.trim())
                setEditingParticipant(null)
                setEditingName('')
              }}
              className="w-full"
            >
              <Check className="mr-2 h-4 w-4" />
              {t('participantSaveAction')}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" />
                {t('cancel')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assigningParticipant !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningParticipant(null)
            setAssignEmail('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-1 pr-8">
            <DialogTitle>{t('participantAssignAccessTitle')}</DialogTitle>
            <DialogDescription>
              {assigningParticipant
                ? t('participantAssignAccessDescription', {
                    participant: assigningParticipant.name,
                  })
                : t('memberAccessDescription')}
            </DialogDescription>
          </div>
          <Input
            type="email"
            value={assignEmail}
            onChange={(event) => setAssignEmail(event.target.value)}
            placeholder={t('memberAccessEmailPlaceholder')}
            autoComplete="email"
            autoFocus
          />
          <DialogFooter className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={isAddingMember || assignEmail.trim().length === 0}
              onClick={async () => {
                if (!assigningParticipant) return
                await onAssignParticipantAccess(
                  assigningParticipant.id,
                  assignEmail.trim(),
                )
                setAssigningParticipant(null)
                setAssignEmail('')
              }}
              className="w-full"
            >
              <MailPlus className="mr-2 h-4 w-4" />
              {t('participantAssignAccessAction')}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" />
                {t('cancel')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border border-border/70 bg-background/60">
        {group.participants.map((participant, index) => {
          const accessInfo = participantAccess[participant.id]
          const canDelete =
            canManageMembers &&
            participant.id !== currentActiveParticipantId &&
            !protectedParticipantIds.has(participant.id)
          const canRemoveAccess =
            !!accessInfo && !accessInfo.isOwner && canManageMembers

          return (
            <div
              key={participant.id}
              className={[
                'px-3 py-2.5',
                index > 0 ? 'border-t border-border/70' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{participant.name}</p>
                  {accessInfo ? (
                    <p className="truncate pt-1 text-[11px] text-muted-foreground">
                      {accessInfo.secondary ?? accessInfo.label}
                    </p>
                  ) : (
                    <p className="truncate pt-1 text-[11px] text-muted-foreground">
                      {t('participantNoAccess')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canRemoveAccess ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={removingAccessUserId === accessInfo.userId}
                      onClick={() =>
                        void onRemoveParticipantAccess(participant.id, accessInfo.userId)
                      }
                    >
                      {removeAccessLabel}
                    </Button>
                  ) : accessInfo?.isOwner ? (
                    <Badge variant="outline" className="h-7 text-[10px]">
                      {t('linkedMembersOwner')}
                    </Badge>
                  ) : canManageMembers ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setAssigningParticipant(participant)
                        setAssignEmail('')
                      }}
                    >
                      <MailPlus className="mr-1.5 h-3.5 w-3.5" />
                      {t('participantAssignAccessAction')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingParticipant(participant)
                      setEditingName(participant.name)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={!canDelete || isUpdatingGroup}
                    onClick={() => void onDeleteParticipant(participant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        <div className="border-t border-border/70 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Input
              value={newParticipantName}
              onChange={(event) => setNewParticipantName(event.target.value)}
              placeholder={t('participantNamePlaceholder')}
            />
            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0"
              disabled={isUpdatingGroup || newParticipantName.trim().length < 2}
              onClick={async () => {
                await onAddParticipant(newParticipantName.trim())
                setNewParticipantName('')
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const { groupId, viewer } = useCurrentGroup()
  const t = useTranslations('Settings')
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(false)
  const { data, isLoading } = trpc.groups.getDetails.useQuery(
    { groupId },
    {
      staleTime: 5 * 60 * 1000,
    },
  )
  const { mutateAsync: deleteGroupAsync, isPending: isDeletingGroup } =
    trpc.groups.delete.useMutation()
  const { mutateAsync: addMemberAsync, isPending: isAddingMember } =
    trpc.groups.addMember.useMutation()
  const { mutateAsync: removeMemberAsync, isPending: isRemovingMember } =
    trpc.groups.removeMember.useMutation()
  const { mutateAsync: updateGroupAsync, isPending: isUpdatingGroup } =
    trpc.groups.update.useMutation()
  const utils = trpc.useUtils()
  const [removingAccessUserId, setRemovingAccessUserId] = useState<string | null>(
    null,
  )
  const isInviteOnboarding = searchParams.get('onboarding') === 'invite'
  const section = searchParams.get('section')
  const view: SettingsView =
    section === 'edit' ||
    section === 'participants' ||
    section === 'export' ||
    section === 'danger'
      ? section
      : isInviteOnboarding
        ? 'participants'
        : 'hub'

  const buildSettingsHref = useMemo(
    () => (nextView: SettingsView) => {
      const params = new URLSearchParams(searchParams.toString())

      if (nextView === 'hub') {
        params.delete('section')
        params.delete('onboarding')
      } else {
        params.set('section', nextView)
      }

      const query = params.toString()
      return query ? `${pathname}?${query}` : pathname
    },
    [pathname, searchParams],
  )

  const getActiveParticipantId = () => data?.currentActiveParticipantId ?? undefined

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  if (!hasHydrated || isLoading || !data?.group) {
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
  const canManageMembers = data.currentUserRole === 'OWNER'
  const protectedParticipantIds = new Set(data.participantsWithExpenses ?? [])
  const linkedMembers = data.members.filter((member) => member.activeParticipant)
  const participantAccess = Object.fromEntries(
    linkedMembers
      .filter((member) => member.activeParticipant)
      .map((member) => [
        member.activeParticipant!.id,
        {
          userId: member.userId,
          label:
            member.user.displayName ||
            member.user.email ||
            member.activeParticipant?.name ||
            t('linkedMembersFallback'),
          secondary:
            member.user.email && member.user.displayName
              ? member.user.email
              : null,
          isOwner: member.role === 'OWNER',
          isCurrentViewer: member.userId === viewer?.id,
        },
      ]),
  )

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
                </>
              }
            />
          </GroupSectionHeader>
        </GroupSectionCard>
      )}

      {view === 'hub' ? (
        <div className="space-y-3">
          <SettingsOptionCard
            onClick={() => router.push(buildSettingsHref('edit'))}
            icon={Pencil}
            title={t('editGroup')}
            description={t('editGroupShort')}
          />
          <SettingsOptionCard
            onClick={() => router.push(buildSettingsHref('participants'))}
            icon={Users}
            title={t('participantsAndAccessTitle')}
            description={t('participantsAndAccessShort')}
          />
          <SettingsOptionCard
            onClick={() => router.push(buildSettingsHref('export'))}
            icon={FileOutput}
            title={t('exportSectionTitle')}
            description={t('exportSectionShort')}
          />
          <SettingsOptionCard
            onClick={() => router.push(buildSettingsHref('danger'))}
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
            onClick={() => router.push(buildSettingsHref('hub'))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToSettings')}
          </Button>
        </div>
      )}

      {view === 'edit' && <EditGroup groupDetails={data} mode="details" />}

      {view === 'participants' && (
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('participantsAndAccessTitle')}
              description={
                isInviteOnboarding
                  ? t('inviteOnboardingDescription')
                  : t('participantsAndAccessDescription')
              }
            />
          </GroupSectionHeader>
            <GroupSectionContent className="space-y-4">
              {isInviteOnboarding && (
                <div className="rounded-lg border border-primary/25 bg-primary/10 p-3.5 text-sm shadow-sm shadow-black/5">
                  <p className="font-medium text-foreground">
                    {t('inviteOnboardingTitle')}
                  </p>
                  <p className="mt-1.5 text-muted-foreground">
                    {t('inviteOnboardingBody')}
                  </p>
                </div>
              )}

            <div className="rounded-xl border border-border/70 bg-background/80 p-3.5 shadow-sm shadow-black/5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{t('shareLinkTitle')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('shareLinkDescription')}
                    </p>
                  </div>
                  <ShareButton
                    group={{ id: data.group.id, name: data.group.name }}
                    showLabel
                    size="default"
                    variant="outline"
                    className="w-full justify-center sm:w-auto"
                  />
                </div>

              </div>
            </div>

            <div className="border-t border-border/70 pt-4">
              <ParticipantsManager
                canManageMembers={canManageMembers}
                currentActiveParticipantId={data.currentActiveParticipantId}
                group={data.group}
                isAddingMember={isAddingMember}
                isUpdatingGroup={isUpdatingGroup}
                onAssignParticipantAccess={async (participantId, email) => {
                  try {
                    const result = await addMemberAsync({
                      groupId,
                      email,
                      participantId,
                    })
                    await utils.groups.invalidate()
                    toast({
                      title: t('memberAddedTitle'),
                      description: t('memberAddedDescription', {
                        participant: result.member.participantName,
                        email: result.member.email ?? email.toLowerCase(),
                      }),
                    })
                  } catch (error) {
                    toast({
                      title: t('memberAddErrorTitle'),
                      description:
                        error instanceof Error
                          ? error.message
                          : t('memberAddErrorDescription'),
                      variant: 'destructive',
                    })
                    throw error
                  }
                }}
                onAddParticipant={async (name) => {
                  const nextParticipants = [
                    ...data.group.participants.map((participant) => ({
                      id: participant.id,
                      name: participant.name,
                    })),
                    { name },
                  ]
                  await updateGroupAsync({
                    groupId,
                    groupFormValues: buildGroupFormValues(data.group, nextParticipants),
                  })
                  await utils.groups.invalidate()
                }}
                onDeleteParticipant={async (participantId) => {
                  const nextParticipants = data.group.participants
                    .filter((participant) => participant.id !== participantId)
                    .map((participant) => ({
                      id: participant.id,
                      name: participant.name,
                    }))
                  await updateGroupAsync({
                    groupId,
                    groupFormValues: buildGroupFormValues(data.group, nextParticipants),
                  })
                  await utils.groups.invalidate()
                }}
                onEditParticipant={async (participantId, name) => {
                  const nextParticipants = data.group.participants.map((participant) =>
                    participant.id === participantId
                      ? { id: participant.id, name }
                      : { id: participant.id, name: participant.name },
                  )
                  await updateGroupAsync({
                    groupId,
                    groupFormValues: buildGroupFormValues(data.group, nextParticipants),
                  })
                  await utils.groups.invalidate()
                }}
                onRemoveParticipantAccess={async (participantId, userId) => {
                  try {
                    const member = linkedMembers.find(
                      (linkedMember) => linkedMember.userId === userId,
                    )
                    setRemovingAccessUserId(userId)
                    await removeMemberAsync({
                      groupId,
                      userId,
                    })
                    await utils.groups.invalidate()
                    toast({
                      title: t('memberRemovedTitle'),
                      description: t('memberRemovedDescription', {
                        participant:
                          member?.activeParticipant?.name ??
                          t('linkedMembersFallback'),
                      }),
                    })
                  } catch (error) {
                    toast({
                      title: t('memberRemoveErrorTitle'),
                      description:
                        error instanceof Error
                          ? error.message
                          : t('memberRemoveErrorDescription'),
                      variant: 'destructive',
                    })
                  } finally {
                    setRemovingAccessUserId(null)
                  }
                }}
                participantAccess={participantAccess}
                protectedParticipantIds={protectedParticipantIds}
                removeAccessLabel={t('memberRemoveAction')}
                removingAccessUserId={removingAccessUserId}
              />
            </div>
          </GroupSectionContent>
        </GroupSectionCard>
      )}

      {view === 'export' && (
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('exportSectionTitle')}
              description={t('exportSectionDescription')}
            />
          </GroupSectionHeader>
          <GroupSectionContent className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-background p-3.5 text-sm shadow-sm shadow-black/5">
              <div className="flex items-center gap-2 font-medium">
                <FileOutput className="h-4 w-4" />
                {t('exportInfoTitle')}
              </div>
              <p className="mt-2 text-muted-foreground">
                {t('exportInfoDescription')}
              </p>
              <div className="mt-3">
                <ExportButton
                  groupId={groupId}
                  showLabel
                  size="default"
                  variant="outline"
                />
              </div>
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
