'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()
  const locale = useLocale()

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
              {group.participants.length}{' '}
              {locale.startsWith('es') ? 'participantes' : 'participants'}
              {group.currencyCode ? ` · ${group.currencyCode}` : ''}
            </p>
          )}
        </div>
        <Button
          asChild
          size="default"
          variant="outline"
          className="h-9 shrink-0 px-2 sm:px-3"
          title={t('Settings.title')}
        >
          <Link href={`/groups/${groupId}/settings`}>
            <Settings className="w-4 h-4" />
            <span className="ml-2 hidden sm:inline">{t('Settings.title')}</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
