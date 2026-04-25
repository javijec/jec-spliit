'use client'

import { ActiveUserModal } from '@/app/groups/[groupId]/expenses/active-user-modal'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { usePwaInstallPrompt } from '@/components/use-pwa-install-prompt'
import {
  ChartColumn,
  HandCoins,
  Download,
  Plus,
  ReceiptText,
  Settings,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useState } from 'react'
import { CurrentGroupProvider } from './current-group-context'
import { GroupHeader } from './group-header'
import { SaveGroupLocally } from './save-recent-group'
import { AppRouterOutput } from '@/trpc/routers/_app'

type Group = AppRouterOutput['groups']['get']['group']
type Viewer = AppRouterOutput['viewer']['getCurrent']['user']

export function GroupLayoutClient({
  groupId,
  initialGroup,
  children,
}: PropsWithChildren<{
  groupId: string
  initialGroup: Group
}>) {
  const [activeUserModalOpen, setActiveUserModalOpen] = useState(false)
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
      staleTime: 5 * 60 * 1000,
    },
  )
  const viewer = viewerData?.user ?? null
  const t = useTranslations('Groups.NotFound')
  const tTabs = useTranslations('GroupTabs')
  const tFlow = useTranslations('ExpenseFlow')
  const pathname = usePathname()
  const { toast } = useToast()
  const { canInstall, install } = usePwaInstallPrompt()

  useEffect(() => {
    if (data && !data.group) {
      toast({
        description: t('text'),
        variant: 'destructive',
      })
    }
  }, [data, t, toast])

  const props =
    isLoading || !data?.group
      ? {
          isLoading: true as const,
          groupId,
          group: undefined,
          viewer,
          currentActiveParticipantId: data?.currentActiveParticipantId ?? null,
        }
      : {
          isLoading: false as const,
          groupId,
          group: data.group,
          viewer,
          currentActiveParticipantId: data.currentActiveParticipantId ?? null,
        }
  const showMobileChrome =
    !isLoading &&
    !!data?.group &&
    !pathname.endsWith('/expenses/create') &&
    !/\/expenses\/[^/]+\/edit$/.test(pathname)
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
        <div className={hideGroupHeaderOnMobile ? 'hidden sm:block' : ''}>
          <GroupHeader />
        </div>
        <div className="pb-24 sm:pb-0">{children}</div>
        <ActiveUserModal
          groupId={groupId}
          open={activeUserModalOpen}
          onOpenChange={setActiveUserModalOpen}
        />
      </CurrentGroupProvider>
    )
  }

  return (
    <CurrentGroupProvider {...props}>
      <div className={hideGroupHeaderOnMobile ? 'hidden sm:block' : ''}>
        <GroupHeader />
      </div>
      <div className="pb-24 sm:pb-0">{children}</div>
      {showMobileChrome && (
        <>
          {(pathname.startsWith(`/groups/${groupId}/summary`) ||
            pathname.startsWith(`/groups/${groupId}/expenses`)) && (
            <Button
              asChild
              size="icon"
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-12 w-12 rounded-2xl border border-primary/15 shadow-lg shadow-primary/20 sm:hidden"
            >
              <Link
                href={`/groups/${groupId}/expenses/create`}
                title={tFlow('createTitle')}
              >
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <nav className="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 px-3 pb-3 sm:hidden">
            <div
              className={`grid items-center gap-1 rounded-[1.35rem] border border-border/80 bg-card/95 px-2 py-2 shadow-[0_12px_32px_hsl(var(--foreground)/0.14)] backdrop-blur ${
                canInstall ? 'grid-cols-5' : 'grid-cols-4'
              }`}
            >
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  asChild
                  variant={tab.active ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-11 flex-col gap-1 rounded-xl ${
                    tab.active
                      ? 'border border-border/70 bg-secondary text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Link href={tab.href}>
                    <tab.icon className="h-4 w-4" />
                    <span className="text-[10px] leading-none">
                      {tTabs(tab.key)}
                    </span>
                  </Link>
                </Button>
              ))}
              {canInstall && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-11 flex-col gap-1 rounded-xl text-muted-foreground"
                  onClick={() => void install()}
                >
                  <Download className="h-4 w-4" />
                  <span className="text-[10px] leading-none">Instalar</span>
                </Button>
              )}
            </div>
          </nav>
        </>
      )}
      <SaveGroupLocally />
      <ActiveUserModal
        groupId={groupId}
        open={activeUserModalOpen}
        onOpenChange={setActiveUserModalOpen}
      />
    </CurrentGroupProvider>
  )
}
