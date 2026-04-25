'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Layers3, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()

  return (
    <div className="mb-3">
      <div className="min-w-0 flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card px-4 py-4 shadow-sm shadow-black/5 sm:px-5">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ) : (
            group && (
              <div className="mb-2.5 flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Users className="h-3.5 w-3.5" />
                  {t('Settings.participantsBadge', {
                    count: group.participants.length,
                  })}
                </Badge>
                {group.currencyCode ? (
                  <Badge variant="outline">
                    <Layers3 className="h-3.5 w-3.5" />
                    {group.currencyCode}
                  </Badge>
                ) : null}
              </div>
            )
          )}
          <h1 className="min-w-0 text-xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
            <Link
              href={`/groups/${groupId}/summary`}
              className="inline-block max-w-full"
            >
              {isLoading ? (
                <Skeleton className="my-1 h-7 w-40 rounded-sm" />
              ) : (
                <span className="block truncate">{group.name}</span>
              )}
            </Link>
          </h1>
        </div>
      </div>
    </div>
  )
}
