'use client'

import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import {
  ChartColumn,
  HandCoins,
  Plus,
  ReceiptText,
  Settings,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'
import { CurrentGroupProvider } from './current-group-context'
import { GroupHeader } from './group-header'
import { SaveGroupLocally } from './save-recent-group'

function getTabLabel(tab: 'summary' | 'expenses' | 'balances' | 'settings', locale: string) {
  if (locale.startsWith('es')) {
    if (tab === 'summary') return 'Resumen'
    if (tab === 'expenses') return 'Gastos'
    if (tab === 'balances') return 'Balances'
    return 'Ajustes'
  }

  if (tab === 'summary') return 'Summary'
  if (tab === 'expenses') return 'Expenses'
  if (tab === 'balances') return 'Balances'
  return 'Settings'
}

export function GroupLayoutClient({
  groupId,
  children,
}: PropsWithChildren<{ groupId: string }>) {
  const { data, isLoading } = trpc.groups.get.useQuery({ groupId })
  const t = useTranslations('Groups.NotFound')
  const pathname = usePathname()
  const locale = useLocale()
  const { toast } = useToast()

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
      ? { isLoading: true as const, groupId, group: undefined }
      : { isLoading: false as const, groupId, group: data.group }
  const showMobileChrome =
    !isLoading &&
    !!data?.group &&
    !pathname.endsWith('/expenses/create') &&
    !/\/expenses\/[^/]+\/edit$/.test(pathname)

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
        <GroupHeader />
        <div className="pb-24 sm:pb-0">{children}</div>
      </CurrentGroupProvider>
    )
  }

  return (
    <CurrentGroupProvider {...props}>
      <GroupHeader />
      <div className="pb-24 sm:pb-0">{children}</div>
      {showMobileChrome && (
        <>
          {(pathname.startsWith(`/groups/${groupId}/summary`) ||
            pathname.startsWith(`/groups/${groupId}/expenses`)) && (
            <Button
              asChild
              size="icon"
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 h-12 w-12 rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:hidden"
            >
              <Link
                href={`/groups/${groupId}/expenses/create`}
                title={locale.startsWith('es') ? 'Crear gasto' : 'Create expense'}
              >
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <nav className="fixed inset-x-0 z-40 bottom-[env(safe-area-inset-bottom)] px-3 pb-3 sm:hidden">
            <div className="grid grid-cols-4 items-center gap-1 rounded-2xl border bg-background/95 px-2 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  asChild
                  variant={tab.active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-11 flex-col gap-1"
                >
                  <Link href={tab.href}>
                    <tab.icon className="h-4 w-4" />
                    <span className="text-[10px] leading-none">
                      {getTabLabel(tab.key, locale)}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </nav>
        </>
      )}
      <SaveGroupLocally />
    </CurrentGroupProvider>
  )
}
