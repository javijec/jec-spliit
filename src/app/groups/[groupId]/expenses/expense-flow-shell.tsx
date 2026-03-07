'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode } from 'react'

export function ExpenseFlowShell({
  groupId,
  title,
  children,
}: {
  groupId: string
  title: string
  children: ReactNode
}) {
  const t = useTranslations('ExpenseFlow')
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur sm:rounded-t-xl sm:border sm:border-b-0">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Link href={`/groups/${groupId}/expenses`} title={title}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-none">
              {title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t('description')}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-0 sm:py-5">
        {children}
      </div>
    </div>
  )
}
