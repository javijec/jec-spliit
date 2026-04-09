'use client'
import { AddGroupByUrlButton } from '@/app/groups/add-group-by-url-button'
import {
  RecentGroups,
  getArchivedGroups,
  getRecentGroups,
  getStarredGroups,
} from '@/app/groups/recent-groups-helpers'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getGroups } from '@/lib/api'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { FolderOpen, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { RecentGroupListCard } from './recent-group-list-card'

export type RecentGroupsState =
  | { status: 'pending' }
  | {
      status: 'partial'
      groups: RecentGroups
      starredGroups: string[]
      archivedGroups: string[]
    }
  | {
      status: 'complete'
      groups: RecentGroups
      groupsDetails: Awaited<ReturnType<typeof getGroups>>
      starredGroups: string[]
      archivedGroups: string[]
    }

function sortGroups({
  groups,
  starredGroups,
  archivedGroups,
}: {
  groups: RecentGroups
  starredGroups: string[]
  archivedGroups: string[]
}) {
  const starredGroupInfo = []
  const groupInfo = []
  const archivedGroupInfo = []
  for (const group of groups) {
    if (starredGroups.includes(group.id)) {
      starredGroupInfo.push(group)
    } else if (archivedGroups.includes(group.id)) {
      archivedGroupInfo.push(group)
    } else {
      groupInfo.push(group)
    }
  }
  return {
    starredGroupInfo,
    groupInfo,
    archivedGroupInfo,
  }
}

export function RecentGroupList() {
  const [state, setState] = useState<RecentGroupsState>({ status: 'pending' })
  const hasSyncedLegacyGroups = useRef(false)
  const utils = trpc.useUtils()
  const { data: viewerData, isLoading: isViewerLoading } =
    trpc.viewer.getCurrent.useQuery()
  const isAuthenticated = !!viewerData?.user
  const { data: myGroupsData, isLoading: isMyGroupsLoading } =
    trpc.groups.mine.useQuery(undefined, {
      enabled: isAuthenticated,
    })
  const syncLegacyGroups = trpc.groups.syncLegacy.useMutation({
    onSuccess: async () => {
      await utils.groups.mine.invalidate()
    },
  })
  const updateMembership = trpc.groups.updateMembership.useMutation({
    onSuccess: async () => {
      await utils.groups.mine.invalidate()
    },
  })
  const removeMembership = trpc.groups.removeMembership.useMutation({
    onSuccess: async () => {
      await utils.groups.mine.invalidate()
    },
  })

  function loadGroups() {
    const groupsInStorage = getRecentGroups()
    const starredGroups = getStarredGroups()
    const archivedGroups = getArchivedGroups()
    setState({
      status: 'partial',
      groups: groupsInStorage,
      starredGroups,
      archivedGroups,
    })
  }

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (!isAuthenticated || state.status === 'pending' || hasSyncedLegacyGroups.current) {
      return
    }

    hasSyncedLegacyGroups.current = true
    const legacyState = state
    if (
      legacyState.groups.length === 0 &&
      legacyState.starredGroups.length === 0 &&
      legacyState.archivedGroups.length === 0
    ) {
      return
    }

    syncLegacyGroups.mutate({
      recentGroups: legacyState.groups,
      starredGroupIds: legacyState.starredGroups,
      archivedGroupIds: legacyState.archivedGroups,
    })
  }, [isAuthenticated, state, syncLegacyGroups])

  if (state.status === 'pending' || isViewerLoading) {
    return (
      <GroupsPage reload={() => undefined}>
        <GroupListSkeleton />
      </GroupsPage>
    )
  }

  if (isAuthenticated) {
    const persistedGroups = myGroupsData?.groups ?? []
    const groups = persistedGroups.map((group) => ({
      id: group.id,
      name: group.name,
    }))
    const starredGroups = persistedGroups
      .filter((group) => group.isStarred)
      .map((group) => group.id)
    const archivedGroups = persistedGroups
      .filter((group) => group.isArchived)
      .map((group) => group.id)

    return (
      <RecentGroupList_
        groups={groups}
        groupsDetails={persistedGroups}
        starredGroups={starredGroups}
        archivedGroups={archivedGroups}
        refreshGroupsFromStorage={() => {
          void utils.groups.mine.invalidate()
        }}
        loading={isMyGroupsLoading}
        onToggleStar={async (groupId, currentlyStarred) => {
          await updateMembership.mutateAsync({
            groupId,
            isStarred: !currentlyStarred,
            ...(currentlyStarred ? {} : { isArchived: false }),
          })
        }}
        onToggleArchive={async (groupId, currentlyArchived) => {
          await updateMembership.mutateAsync({
            groupId,
            isArchived: !currentlyArchived,
            ...(currentlyArchived ? {} : { isStarred: false }),
          })
        }}
        onRemove={async (group) => {
          await removeMembership.mutateAsync({ groupId: group.id })
        }}
      />
    )
  }

  return (
    <RecentGroupList_
      groups={state.groups}
      starredGroups={state.starredGroups}
      archivedGroups={state.archivedGroups}
      refreshGroupsFromStorage={() => loadGroups()}
    />
  )
}

function RecentGroupList_({
  groups,
  groupsDetails,
  starredGroups,
  archivedGroups,
  refreshGroupsFromStorage,
  loading = false,
  onToggleStar,
  onToggleArchive,
  onRemove,
}: {
  groups: RecentGroups
  groupsDetails?: AppRouterOutput['groups']['mine']['groups']
  starredGroups: string[]
  archivedGroups: string[]
  refreshGroupsFromStorage: () => void
  loading?: boolean
  onToggleStar?: (groupId: string, isStarred: boolean) => Promise<void> | void
  onToggleArchive?: (
    groupId: string,
    isArchived: boolean,
  ) => Promise<void> | void
  onRemove?: (group: RecentGroups[number]) => Promise<void> | void
}) {
  const t = useTranslations('Groups')
  const { data, isLoading } = trpc.groups.list.useQuery(
    {
      groupIds: groups.map((group) => group.id),
    },
    {
      enabled: groups.length > 0 && !groupsDetails,
    },
  )
  const resolvedGroupDetails = groupsDetails ?? data?.groups ?? []

  if (groups.length === 0) {
    return (
      <GroupsPage reload={refreshGroupsFromStorage}>
        <GroupSectionCard>
          <GroupSectionHeader>
            <GroupSectionTitle className="flex items-center gap-2 text-xl leading-none">
              <FolderOpen className="h-5 w-5" />
              {t('NoRecent.description')}
            </GroupSectionTitle>
            <GroupSectionDescription className="mt-2">
              {t('NoRecent.orAsk')}
            </GroupSectionDescription>
          </GroupSectionHeader>
          <GroupSectionContent className="pt-0" />
        </GroupSectionCard>
      </GroupsPage>
    )
  }

  if (loading || (groups.length > 0 && !groupsDetails && (isLoading || !data))) {
    return (
      <GroupsPage reload={refreshGroupsFromStorage}>
        <GroupListSkeleton />
      </GroupsPage>
    )
  }

  if (!groupsDetails && resolvedGroupDetails.length === 0) {
    return (
      <GroupsPage reload={refreshGroupsFromStorage}>
        <GroupSectionCard>
          <GroupSectionHeader>
            <GroupSectionTitle className="flex items-center gap-2 text-xl leading-none">
              <FolderOpen className="h-5 w-5" />
              {t('NoRecent.description')}
            </GroupSectionTitle>
            <GroupSectionDescription className="mt-2">
              {t('NoRecent.orAsk')}
            </GroupSectionDescription>
          </GroupSectionHeader>
          <GroupSectionContent className="pt-0" />
        </GroupSectionCard>
      </GroupsPage>
    )
  }

  const { starredGroupInfo, groupInfo, archivedGroupInfo } = sortGroups({
    groups,
    starredGroups,
    archivedGroups,
  })

  return (
    <GroupsPage reload={refreshGroupsFromStorage}>
      {starredGroupInfo.length > 0 && (
        <>
          <SectionHeading>{t('starred')}</SectionHeading>
          <GroupList
            groups={starredGroupInfo}
            groupDetails={resolvedGroupDetails}
            archivedGroups={archivedGroups}
            starredGroups={starredGroups}
            refreshGroupsFromStorage={refreshGroupsFromStorage}
            onToggleStar={onToggleStar}
            onToggleArchive={onToggleArchive}
            onRemove={onRemove}
          />
        </>
      )}

      {groupInfo.length > 0 && (
        <>
          <SectionHeading className="mt-6">{t('recent')}</SectionHeading>
          <GroupList
            groups={groupInfo}
            groupDetails={resolvedGroupDetails}
            archivedGroups={archivedGroups}
            starredGroups={starredGroups}
            refreshGroupsFromStorage={refreshGroupsFromStorage}
            onToggleStar={onToggleStar}
            onToggleArchive={onToggleArchive}
            onRemove={onRemove}
          />
        </>
      )}

      {archivedGroupInfo.length > 0 && (
        <>
          <SectionHeading className="mt-6 opacity-60">{t('archived')}</SectionHeading>
          <div className="opacity-75">
            <GroupList
              groups={archivedGroupInfo}
              groupDetails={resolvedGroupDetails}
              archivedGroups={archivedGroups}
              starredGroups={starredGroups}
              refreshGroupsFromStorage={refreshGroupsFromStorage}
              onToggleStar={onToggleStar}
              onToggleArchive={onToggleArchive}
              onRemove={onRemove}
            />
          </div>
        </>
      )}
    </GroupsPage>
  )
}

function GroupList({
  groups,
  groupDetails,
  starredGroups,
  archivedGroups,
  refreshGroupsFromStorage,
  onToggleStar,
  onToggleArchive,
  onRemove,
}: {
  groups: RecentGroups
  groupDetails?:
    | AppRouterOutput['groups']['list']['groups']
    | AppRouterOutput['groups']['mine']['groups']
  starredGroups: string[]
  archivedGroups: string[]
  refreshGroupsFromStorage: () => void
  onToggleStar?: (groupId: string, isStarred: boolean) => Promise<void> | void
  onToggleArchive?: (
    groupId: string,
    isArchived: boolean,
  ) => Promise<void> | void
  onRemove?: (group: RecentGroups[number]) => Promise<void> | void
}) {
  return (
    <ul className="grid gap-3">
      {groups.map((group) => (
        <RecentGroupListCard
          key={group.id}
          group={group}
          groupDetail={groupDetails?.find(
            (groupDetail) => groupDetail.id === group.id,
          )}
          isStarred={starredGroups.includes(group.id)}
          isArchived={archivedGroups.includes(group.id)}
          refreshGroupsFromStorage={refreshGroupsFromStorage}
          onToggleStar={onToggleStar}
          onToggleArchive={onToggleArchive}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}

function GroupsPage({
  children,
  reload,
}: PropsWithChildren<{ reload: () => void }>) {
  const t = useTranslations('Groups')
  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card px-4 py-4 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)] sm:px-5 sm:py-5">
        <div className="absolute right-[-3rem] top-[-2rem] h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t('myGroups')}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              <Link href="/groups">{t('myGroups')}</Link>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {t('groupsHeroDescription')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/groups/create">{t('create')}</Link>
            </Button>
            <div className="w-full sm:w-auto">
              <AddGroupByUrlButton reload={reload} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SectionHeading({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`mb-2 flex items-center gap-2 ${className}`}>
      <div className="h-px flex-1 bg-border/80" />
      <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {children}
      </h2>
      <div className="h-px flex-1 bg-border/80" />
    </div>
  )
}

function GroupListSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-6 w-28 rounded-sm" />
        <div className="mt-3 grid gap-3">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      </div>

      <div>
        <Skeleton className="h-6 w-32 rounded-sm" />
        <div className="mt-3 grid gap-3">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      </div>
    </div>
  )
}

function GroupCardSkeleton() {
  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-card/90 p-4 shadow-[0_12px_28px_hsl(var(--foreground)/0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-40 rounded-sm" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-12 rounded-sm" />
            <Skeleton className="h-4 w-28 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-sm" />
      </div>
    </div>
  )
}
