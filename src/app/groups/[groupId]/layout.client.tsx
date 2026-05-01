'use client'

import { ActiveUserModal } from '@/app/groups/[groupId]/expenses/active-user-modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import {
  ChartColumn,
  HandCoins,
  Plus,
  ReceiptText,
  Settings,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { CurrentGroupProvider } from './current-group-context'
import { GroupHeader } from './group-header'
import { loadGroupSnapshot, saveGroupSnapshot } from './group-snapshot'
import { SaveGroupLocally } from './save-recent-group'

type Group = NonNullable<AppRouterOutput['groups']['get']['group']>

const EXPENSE_PREFETCH_LIMIT = 20

export function GroupLayoutClient({
  groupId,
  initialGroup,
  children,
}: PropsWithChildren<{
  groupId: string
  initialGroup: Group
}>) {
  const [activeUserModalOpen, setActiveUserModalOpen] = useState(false)
  const prefetchState = useRef<string | null>(null)
  const intentPrefetchState = useRef<Set<string>>(new Set())
  const utils = trpc.useUtils()
  const router = useRouter()
  const { data: viewerData } = trpc.viewer.getCurrent.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  })
  const { data, isLoading } = trpc.groups.get.useQuery(
    { groupId },
    {
      placeholderData: {
        group: initialGroup,
        currentActiveParticipantId: null,
      },
      staleTime: 15 * 60 * 1000,
      refetchOnMount: false,
    },
  )
  const { data: groupDetailsData } = trpc.groups.getDetails.useQuery(
    { groupId },
    {
      staleTime: 15 * 60 * 1000,
      refetchOnMount: false,
    },
  )
  const viewer = viewerData?.user ?? null
  const viewerId = viewer?.id ?? null
  const isAuthResolved = viewerData !== undefined
  const t = useTranslations('Groups.NotFound')
  const tTabs = useTranslations('GroupTabs')
  const tFlow = useTranslations('ExpenseFlow')
  const pathname = usePathname()
  const { toast } = useToast()

  useEffect(() => {
    if (data && !data.group) {
      toast({
        description: t('text'),
        variant: 'destructive',
      })
    }
  }, [data, t, toast])

  const [groupSnapshot, setGroupSnapshot] = useState<{
    group: Group
    groupDetails: AppRouterOutput['groups']['getDetails'] | null
  } | null>(null)

  useEffect(() => {
    if (!groupSnapshot) {
      const storedSnapshot = loadGroupSnapshot(viewerId, groupId)
      if (storedSnapshot) {
        setGroupSnapshot({
          group: storedSnapshot.group,
          groupDetails: storedSnapshot.groupDetails,
        })
      }
    }
  }, [groupId, groupSnapshot, viewerId])

  useEffect(() => {
    if (!data?.group) return

    const nextSnapshot = {
      group: data.group,
      groupDetails: groupDetailsData ?? null,
    }

    setGroupSnapshot(nextSnapshot)
    saveGroupSnapshot(viewerId, groupId, nextSnapshot)
  }, [data?.group, groupDetailsData, groupId, viewerId])

  useEffect(() => {
    if (isLoading || !data?.group) return

    const prefetchKey = `${groupId}:${viewer?.id ?? 'guest'}`
    if (prefetchState.current === prefetchKey) return
    prefetchState.current = prefetchKey

    const runPrefetch = () => {
      void Promise.allSettled([
        utils.groups.getDetails.prefetch({ groupId }),
        utils.categories.list.prefetch(),
        router.prefetch(`/groups/${groupId}/summary`),
        router.prefetch(`/groups/${groupId}/balances`),
        router.prefetch(`/groups/${groupId}/settings`),
      ])
    }

    type IdleWindow = Window & {
      requestIdleCallback?: (callback: () => void) => number
      cancelIdleCallback?: (id: number) => void
    }

    const idleWindow = window as IdleWindow
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const idleId = idleWindow.requestIdleCallback(runPrefetch)
      return () => {
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = window.setTimeout(runPrefetch, 250)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [data?.group, groupId, isLoading, router, utils, viewer?.id])

  function prefetchTabIntent(
    target: 'summary' | 'expenses' | 'balances' | 'settings',
  ) {
    const cacheKey = `${groupId}:${target}`
    if (intentPrefetchState.current.has(cacheKey)) return
    intentPrefetchState.current.add(cacheKey)

    switch (target) {
      case 'summary':
        void router.prefetch(`/groups/${groupId}/summary`)
        return
      case 'expenses':
        void Promise.allSettled([
          router.prefetch(`/groups/${groupId}/expenses`),
          utils.groups.expenses.list.prefetchInfinite({
            groupId,
            limit: EXPENSE_PREFETCH_LIMIT,
            filter: '',
          }),
          utils.categories.list.prefetch(),
        ])
        return
      case 'balances':
        void Promise.allSettled([
          router.prefetch(`/groups/${groupId}/balances`),
          utils.groups.balances.list.prefetch({ groupId }),
        ])
        return
      case 'settings':
        void Promise.allSettled([
          router.prefetch(`/groups/${groupId}/settings`),
          utils.groups.getDetails.prefetch({ groupId }),
        ])
        return
    }
  }

  function prefetchCreateExpenseIntent() {
    const cacheKey = `${groupId}:create-expense`
    if (intentPrefetchState.current.has(cacheKey)) return
    intentPrefetchState.current.add(cacheKey)

    void Promise.allSettled([
      router.prefetch(`/groups/${groupId}/expenses/create`),
      utils.categories.list.prefetch(),
      utils.groups.getDetails.prefetch({ groupId }),
    ])
  }

  const props =
    isLoading || !data?.group
      ? {
          isLoading: true as const,
          groupId,
          group: undefined,
          groupDetails: groupDetailsData ?? null,
          groupSnapshot,
          viewer,
          currentActiveParticipantId: data?.currentActiveParticipantId ?? null,
        }
      : {
          isLoading: false as const,
          groupId,
          group: data.group,
          groupDetails: groupDetailsData ?? null,
          groupSnapshot,
          viewer,
          currentActiveParticipantId: data.currentActiveParticipantId ?? null,
        }
  const showMobileChrome =
    !isLoading &&
    !!data?.group &&
    !pathname.endsWith('/expenses/create') &&
    !/\/expenses\/[^/]+\/edit$/.test(pathname)
  const hideGroupHeaderCompletely =
    pathname.startsWith(`/groups/${groupId}/settings`) ||
    pathname.startsWith(`/groups/${groupId}/edit`) ||
    pathname.startsWith(`/groups/${groupId}/information`)
  const hideGroupHeaderOnMobile =
    pathname === `/groups/${groupId}` ||
    pathname === `/groups/${groupId}/summary` ||
    pathname.startsWith(`/groups/${groupId}/expenses`) ||
    pathname === `/groups/${groupId}/balances`

  const tabs = [
    {
      key: 'summary',
      href: `/groups/${groupId}/summary`,
      icon: ChartColumn,
      active:
        pathname === `/groups/${groupId}` ||
        pathname.startsWith(`/groups/${groupId}/summary`),
    },
    {
      key: 'expenses',
      href: `/groups/${groupId}/expenses`,
      icon: ReceiptText,
      active:
        pathname.startsWith(`/groups/${groupId}/expenses`) &&
        !pathname.includes('/expenses/create') &&
        !/\/expenses\/[^/]+\/edit$/.test(pathname),
    },
    {
      key: 'balances',
      href: `/groups/${groupId}/balances`,
      icon: HandCoins,
      active: pathname.startsWith(`/groups/${groupId}/balances`),
    },
    {
      key: 'settings',
      href: `/groups/${groupId}/settings`,
      icon: Settings,
      active:
        pathname.startsWith(`/groups/${groupId}/settings`) ||
        pathname.startsWith(`/groups/${groupId}/edit`) ||
        pathname.startsWith(`/groups/${groupId}/information`),
    },
  ] as const

  if (isLoading) {
    return (
      <CurrentGroupProvider {...props}>
        {!hideGroupHeaderCompletely && (
          <div className={hideGroupHeaderOnMobile ? 'hidden sm:block' : ''}>
            <GroupHeader />
          </div>
        )}
        <div className="pb-24 sm:pb-0">{children}</div>
        <ActiveUserModal
          groupId={groupId}
          isAuthResolved={isAuthResolved}
          open={activeUserModalOpen}
          onOpenChange={setActiveUserModalOpen}
        />
      </CurrentGroupProvider>
    )
  }

  return (
    <CurrentGroupProvider {...props}>
      {!hideGroupHeaderCompletely && (
        <div className={hideGroupHeaderOnMobile ? 'hidden sm:block' : ''}>
          <GroupHeader />
        </div>
      )}
      <div className="pb-24 sm:pb-0">{children}</div>
      {showMobileChrome && (
        <>
          {(pathname.startsWith(`/groups/${groupId}/summary`) ||
            pathname.startsWith(`/groups/${groupId}/expenses`)) && (
            <Button
              asChild
              size="icon"
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 z-40 h-12 w-12 rounded-lg border border-primary/15 shadow-lg shadow-primary/20 sm:hidden"
              onPointerEnter={prefetchCreateExpenseIntent}
              onFocus={prefetchCreateExpenseIntent}
              onTouchStart={prefetchCreateExpenseIntent}
            >
              <Link
                href={`/groups/${groupId}/expenses/create`}
                title={tFlow('createTitle')}
              >
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <nav className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 border-t border-border/80 bg-card/95 px-2 py-2 shadow-[0_-8px_20px_hsl(var(--foreground)/0.08)] backdrop-blur sm:hidden">
            <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  asChild
                  variant={tab.active ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-11 flex-col gap-1 rounded-md ${
                    tab.active
                      ? 'border border-border/70 bg-secondary text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                  onPointerEnter={() => prefetchTabIntent(tab.key)}
                  onFocus={() => prefetchTabIntent(tab.key)}
                  onTouchStart={() => prefetchTabIntent(tab.key)}
                >
                  <Link href={tab.href}>
                    <tab.icon className="h-4 w-4" />
                    <span className="text-[10px] leading-none">
                      {tTabs(tab.key)}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </nav>
        </>
      )}
      <SaveGroupLocally />
      <ActiveUserModal
        groupId={groupId}
        isAuthResolved={isAuthResolved}
        open={activeUserModalOpen}
        onOpenChange={setActiveUserModalOpen}
      />
    </CurrentGroupProvider>
  )
}
