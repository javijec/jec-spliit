'use client'
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
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getGroups } from '@/lib/api'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { FolderOpen, LogIn } from 'lucide-react'
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

const MY_GROUPS_CACHE_KEY = 'nexogastos.groups.mine.v1'

export function RecentGroupList() {
  const [state, setState] = useState<RecentGroupsState>({ status: 'pending' })
  const hasSyncedLegacyGroups = useRef(false)
  const utils = trpc.useUtils()
  const { data: viewerData, isLoading: isViewerLoading } =
    trpc.viewer.getCurrent.useQuery()
  const isAuthenticated = !!viewerData?.user
  const legacySyncKey = viewerData?.user
    ? `legacy-groups-synced:${viewerData.user.id}`
    : null
  const [cachedMyGroups, setCachedMyGroups] = useState<
    AppRouterOutput['groups']['mine']['groups'] | null
  >(null)
  const { data: myGroupsData, isLoading: isMyGroupsLoading } =
    trpc.groups.mine.useQuery(undefined, {
      enabled: isAuthenticated,
      placeholderData: cachedMyGroups ? { groups: cachedMyGroups } : undefined,
      staleTime: 15 * 60 * 1000,
      refetchOnMount: false,
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
    if (typeof window === 'undefined' || !viewerData?.user) return

    try {
      const raw = window.localStorage.getItem(
        `${MY_GROUPS_CACHE_KEY}:${viewerData.user.id}`,
      )
      if (!raw) return

      const parsed = JSON.parse(raw) as {
        groups?: AppRouterOutput['groups']['mine']['groups']
      }

      if (parsed.groups?.length) {
        setCachedMyGroups(parsed.groups)
      }
    } catch {
      // Ignore malformed cache data and continue with network state.
    }
  }, [viewerData?.user])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !viewerData?.user ||
      !myGroupsData?.groups
    ) {
      return
    }

    try {
      window.localStorage.setItem(
        `${MY_GROUPS_CACHE_KEY}:${viewerData.user.id}`,
        JSON.stringify({ groups: myGroupsData.groups }),
      )
    } catch {
      // Ignore persistence failures and continue with in-memory cache.
    }
  }, [myGroupsData?.groups, viewerData?.user])

  useEffect(() => {
    if (
      !isAuthenticated ||
      state.status === 'pending' ||
      hasSyncedLegacyGroups.current
    ) {
      return
    }
    if (legacySyncKey && localStorage.getItem(legacySyncKey) === '1') {
      hasSyncedLegacyGroups.current = true
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
    if (legacySyncKey) {
      localStorage.setItem(legacySyncKey, '1')
    }
  }, [isAuthenticated, legacySyncKey, state, syncLegacyGroups])

  if (state.status === 'pending' || isViewerLoading) {
    return (
      <GroupsPage reload={() => undefined}>
        <GroupListSkeleton />
      </GroupsPage>
    )
  }

  if (!isAuthenticated) {
    return (
      <GroupsPage isAuthenticated={false}>
        <SignInCard />
      </GroupsPage>
    )
  }

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

  if (
    loading ||
    (groups.length > 0 && !groupsDetails && (isLoading || !data))
  ) {
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
          <SectionHeading className="mt-6 opacity-60">
            {t('archived')}
          </SectionHeading>
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

function SignInCard() {
  const t = useTranslations('Groups.SignIn')

  return (
    <GroupSectionCard>
      <GroupSectionHeader>
        <GroupSectionTitle className="flex items-center gap-2 text-xl leading-none">
          <LogIn className="h-5 w-5" />
          {t('title')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {t('description')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent className="pt-0">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/auth/login?connection=google-oauth2">{t('action')}</Link>
        </Button>
      </GroupSectionContent>
    </GroupSectionCard>
  )
}

function GroupsPage({
  children,
  isAuthenticated = true,
}: PropsWithChildren<{ reload?: () => void; isAuthenticated?: boolean }>) {
  const t = useTranslations('Groups')
  return (
    <div className="space-y-5">
      <PageHeader
        title={<Link href="/groups">{t('myGroups')}</Link>}
        description={t('groupsHeroDescription')}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link
              href={
                isAuthenticated
                  ? '/groups/create'
                  : '/auth/login?connection=google-oauth2'
              }
            >
              {isAuthenticated ? t('create') : t('SignIn.action')}
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">{children}</div>
    </div>
  )
}

function SectionHeading({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`mb-2 flex items-center gap-3 ${className}`}>
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
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
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-sm shadow-black/5">
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
