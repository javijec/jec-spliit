'use client'

import { GroupMobileNav } from '@/components/layout/group-shell-nav'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
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

  const hideMobileNav =
    pathname.endsWith('/expenses/create') ||
    /\/expenses\/[^/]+\/edit$/.test(pathname)

  return (
    <CurrentGroupProvider {...props}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-24 md:gap-6 md:pb-0">
        <GroupHeader />
        <div className="min-w-0">{children}</div>
      </div>
      {!hideMobileNav && <GroupMobileNav groupId={groupId} />}
      <SaveGroupLocally />
    </CurrentGroupProvider>
  )
}
