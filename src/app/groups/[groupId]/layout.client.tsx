'use client'

import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { HandCoins, Plus, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'
import { CurrentGroupProvider } from './current-group-context'
import { GroupHeader } from './group-header'
import { SaveGroupLocally } from './save-recent-group'

export function GroupLayoutClient({
  groupId,
  children,
}: PropsWithChildren<{ groupId: string }>) {
  const { data, isLoading } = trpc.groups.get.useQuery({ groupId })
  const t = useTranslations('Groups.NotFound')
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

  const props =
    isLoading || !data?.group
      ? { isLoading: true as const, groupId, group: undefined }
      : { isLoading: false as const, groupId, group: data.group }
  const showMobileBottomNav =
    !isLoading &&
    !!data?.group &&
    !pathname.endsWith('/expenses/create') &&
    !/\/expenses\/[^/]+\/edit$/.test(pathname)

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
      {showMobileBottomNav && (
        <nav className="fixed inset-x-0 z-40 sm:hidden bottom-[env(safe-area-inset-bottom)] px-3 pb-3">
          <div className="grid grid-cols-3 items-center gap-1 rounded-2xl border bg-background/95 backdrop-blur px-2 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <Button
              asChild
              variant={pathname.includes('/balances') ? 'ghost' : 'secondary'}
              size="sm"
              className="h-10 flex-col gap-0.5"
            >
              <Link href={`/groups/${groupId}/expenses`}>
                <Wallet className="h-4 w-4" />
                <span className="text-[10px] leading-none">General</span>
              </Link>
            </Button>
            <Button
              asChild
              size="icon"
              className="mx-auto h-11 w-11 rounded-full shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
            >
              <Link href={`/groups/${groupId}/expenses/create`} title="Crear gasto">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant={pathname.includes('/balances') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-10 flex-col gap-0.5"
            >
              <Link href={`/groups/${groupId}/balances`}>
                <HandCoins className="h-4 w-4" />
                <span className="text-[10px] leading-none">Liquidaciones</span>
              </Link>
            </Button>
          </div>
        </nav>
      )}
      <SaveGroupLocally />
    </CurrentGroupProvider>
  )
}
