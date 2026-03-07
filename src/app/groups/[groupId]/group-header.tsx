'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-3 border-b bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-1 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0">
      <div className="min-w-0 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 font-semibold text-xl sm:text-3xl leading-tight tracking-tight">
            <Link
              href={`/groups/${groupId}/summary`}
              className="inline-block max-w-full"
            >
              {isLoading ? (
                <Skeleton className="mt-1.5 mb-1.5 h-7 w-48" />
              ) : (
                <span className="block truncate">{group.name}</span>
              )}
            </Link>
          </h1>
          {!isLoading && group && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
              {t('Settings.participantsBadge', {
                count: group.participants.length,
              })}
              {group.currencyCode ? ` · ${group.currencyCode}` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
