'use client'

import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
  }, [data])

  const props =
    isLoading || !data?.group
      ? { isLoading: true as const, groupId, group: undefined }
      : { isLoading: false as const, groupId, group: data.group }
  const showBottomCreateBar =
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
      <div className="pb-20 sm:pb-0">{children}</div>
      {showBottomCreateBar && (
        <div className="fixed right-4 z-40 sm:hidden bottom-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            asChild
            size="icon"
            className="h-12 w-12 rounded-full shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
          >
            <Link href={`/groups/${groupId}/expenses/create`} title="Crear gasto">
              <Plus className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      )}
      <SaveGroupLocally />
    </CurrentGroupProvider>
  )
}
