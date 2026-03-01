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
      className="overflow-x-auto"
      onValueChange={(value) => {
        router.push(`/groups/${groupId}/${value}`)
      }}
    >
      <TabsList className="h-11 w-max min-w-full sm:min-w-0 rounded-lg border">
        <TabsTrigger value="expenses" className="px-3.5">
          General
        </TabsTrigger>
        <TabsTrigger value="balances" className="px-3.5">
          Liquidaciones
        </TabsTrigger>
        <TabsTrigger value="stats" className="px-3.5">
          {t('Stats.title')}
        </TabsTrigger>
        <TabsTrigger value="activity" className="px-3.5">
          {t('Activity.title')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
