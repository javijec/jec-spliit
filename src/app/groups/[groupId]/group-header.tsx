'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()

  return (
    <div className="-mx-3 mb-4 border-b bg-background px-3 py-4 sm:mx-0 sm:mb-5 sm:px-0 sm:py-0">
      <div className="min-w-0 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="min-w-0 text-xl font-semibold leading-tight tracking-tight sm:text-3xl">
            <Link
              href={`/groups/${groupId}/summary`}
              className="inline-block max-w-full"
            >
              {isLoading ? (
                <Skeleton className="mb-1.5 mt-1.5 h-7 w-48" />
              ) : (
                <span className="block truncate">{group.name}</span>
              )}
            </Link>
          </h1>
          {!isLoading && group && (
            <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
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
