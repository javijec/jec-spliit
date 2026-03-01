'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()

  return (
    <div className="pb-1">
      <div className="min-w-0 flex items-center justify-between gap-2">
        <h1 className="min-w-0 flex-1 font-semibold text-2xl sm:text-3xl leading-tight tracking-tight">
          <Link href={`/groups/${groupId}`} className="inline-block max-w-full">
            {isLoading ? (
              <Skeleton className="mt-1.5 mb-1.5 h-7 w-48" />
            ) : (
              <span className="block truncate">{group.name}</span>
            )}
          </Link>
        </h1>
        <Button
          asChild
          size="default"
          variant="outline"
          className="h-9 shrink-0 px-2 sm:px-3"
          title={t('Settings.title')}
        >
          <Link href={`/groups/${groupId}/edit`}>
            <Settings className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">{t('Settings.title')}</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
