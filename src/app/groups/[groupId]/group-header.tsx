'use client'

import { GroupTabs } from '@/app/groups/[groupId]/group-tabs'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
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
    <div className="flex flex-col gap-3 pb-1">
      <div className="min-w-0">
        <h1 className="font-semibold text-2xl sm:text-3xl leading-tight tracking-tight">
          <Link href={`/groups/${groupId}`} className="inline-block max-w-full">
            {isLoading ? (
              <Skeleton className="mt-1.5 mb-1.5 h-7 w-48" />
            ) : (
              <span className="block truncate">{group.name}</span>
            )}
          </Link>
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <GroupTabs groupId={groupId} />
        </div>
        {group && (
          <div className="flex items-center gap-2">
            <ShareButton group={group} />
            <Button
              asChild
              size="icon"
              variant="outline"
              title={t('Settings.title')}
            >
              <Link href={`/groups/${groupId}/edit`}>
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
