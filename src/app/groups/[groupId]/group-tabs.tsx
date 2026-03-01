'use client'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'

type Props = {
  groupId: string
}

export function GroupTabs({ groupId }: Props) {
  const t = useTranslations()
  const pathname = usePathname()
  const value =
    pathname.replace(/\/groups\/[^\/]+\/([^/]+).*/, '$1') || 'expenses'
  const router = useRouter()

  return (
    <Tabs
      value={value}
      className="w-full"
      onValueChange={(value) => {
        router.push(`/groups/${groupId}/${value}`)
      }}
    >
      <TabsList className="h-auto w-full rounded-lg border grid grid-cols-2 gap-1 sm:flex sm:h-11 sm:w-max sm:min-w-0">
        <TabsTrigger value="expenses" className="px-3.5 text-xs sm:text-sm">
          General
        </TabsTrigger>
        <TabsTrigger value="balances" className="px-3.5 text-xs sm:text-sm">
          Liquidaciones
        </TabsTrigger>
        <TabsTrigger value="stats" className="px-3.5 text-xs sm:text-sm">
          {t('Stats.title')}
        </TabsTrigger>
        <TabsTrigger value="activity" className="px-3.5 text-xs sm:text-sm">
          {t('Activity.title')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
