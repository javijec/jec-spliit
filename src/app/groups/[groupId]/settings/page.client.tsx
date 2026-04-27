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
  Link2,
  MailPlus,
  Pencil,
  ShieldCheck,
  Trash2,
  UserMinus,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { EditGroup } from '../edit/edit-group'

type SettingsView =
  | 'hub'
  | 'edit'
  | 'participants'
  | 'export'
  | 'danger'

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
  const utils = trpc.useUtils()
  const [memberEmail, setMemberEmail] = useState('')
  const [memberParticipantId, setMemberParticipantId] = useState('')
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
  const canManageMembers = data.currentUserRole === 'OWNER'
  const availableParticipants = data.group.participants.filter(
    (participant) => !participant.appUserId,
  )
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

                {canManageMembers && (
                  <div className="grid gap-2 border-t border-border/70 pt-3">
                    <p className="text-sm font-medium">{t('memberAccessTitle')}</p>
                    {availableParticipants.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('memberAccessNoParticipants')}
                      </p>
                    ) : (
                      <>
                        <Input
                          type="email"
                          value={memberEmail}
                          onChange={(event) => setMemberEmail(event.target.value)}
                          placeholder={t('memberAccessEmailPlaceholder')}
                          autoComplete="email"
                        />
                        <select
                          value={memberParticipantId}
                          onChange={(event) =>
                            setMemberParticipantId(event.target.value)
                          }
                          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">
                            {t('memberAccessParticipantPlaceholder')}
                          </option>
                          {availableParticipants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          disabled={
                            isAddingMember ||
                            memberEmail.trim().length === 0 ||
                            memberParticipantId.length === 0
                          }
                          onClick={async () => {
                            try {
                              const result = await addMemberAsync({
                                groupId,
                                email: memberEmail.trim(),
                                participantId: memberParticipantId,
                              })
                              setMemberEmail('')
                              setMemberParticipantId('')
                              await utils.groups.invalidate()
                              toast({
                                title: t('memberAddedTitle'),
                                description: t('memberAddedDescription', {
                                  participant: result.member.participantName,
                                  email:
                                    result.member.email ??
                                    memberEmail.trim().toLowerCase(),
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
                            }
                          }}
                          className="h-11 w-full sm:w-auto"
                        >
                          {t('memberAccessSubmit')}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {linkedMembers.length > 0 && (
                  <div className="grid gap-2 border-t border-border/70 pt-3">
                    <p className="text-sm font-medium">{t('linkedMembersTitle')}</p>
                    {linkedMembers.map((member) => {
                      const isOwner = member.role === 'OWNER'
                      const label =
                        member.user.displayName ||
                        member.user.email ||
                        member.activeParticipant?.name ||
                        t('linkedMembersFallback')

                      return (
                        <div
                          key={`${member.userId}-${member.activeParticipant?.id ?? 'none'}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{label}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {member.activeParticipant?.name ?? t('linkedMembersFallback')}
                            </p>
                          </div>

                          {isOwner ? (
                            <Badge variant="outline">{t('linkedMembersOwner')}</Badge>
                          ) : canManageMembers ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isRemovingMember}
                              onClick={async () => {
                                try {
                                  await removeMemberAsync({
                                    groupId,
                                    userId: member.userId,
                                  })
                                  await utils.groups.invalidate()
                                  toast({
                                    title: t('memberRemovedTitle'),
                                    description: t('memberRemovedDescription', {
                                      participant:
                                        member.activeParticipant?.name ??
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
                                }
                              }}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              {t('memberRemoveAction')}
                            </Button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border/70 pt-4">
              <EditGroup
                groupDetails={data}
                mode="participants"
                participantAccess={participantAccess}
                removingParticipantUserId={removingAccessUserId}
                removeAccessLabel={t('memberRemoveAction')}
                onRemoveParticipantAccess={async (_participantId, userId) => {
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
