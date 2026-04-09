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
    <div className="mb-4">
      <div className="min-w-0 flex items-center justify-between gap-2 rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] px-4 py-4 shadow-[0_14px_34px_hsl(var(--foreground)/0.05)] sm:px-5">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="mb-3 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ) : (
            group && (
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <Users className="h-3.5 w-3.5" />
                  {t('Settings.participantsBadge', {
                    count: group.participants.length,
                  })}
                </Badge>
                {group.currencyCode ? (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    <Layers3 className="h-3.5 w-3.5" />
                    {group.currencyCode}
                  </Badge>
                ) : null}
              </div>
            )
          )}
          <h1 className="min-w-0 text-xl font-semibold leading-tight tracking-tight sm:text-[1.9rem]">
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
          {isLoading ? (
            <Skeleton className="mt-2 h-4 w-28 rounded-sm" />
          ) : (
            group && (
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {group.information?.trim() || t('Summary.description')}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
