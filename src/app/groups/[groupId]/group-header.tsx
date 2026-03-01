'use client'

import { GroupTabs } from '@/app/groups/[groupId]/group-tabs'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()

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
        {group && <ShareButton group={group} />}
      </div>
    </div>
  )
}
