'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Sparkles } from 'lucide-react'
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
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:rounded-[1.35rem] sm:border sm:bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--background))_100%)]">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl">
            <Link href={`/groups/${groupId}/expenses`} title={title}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <Badge variant="secondary" className="mb-2 w-fit rounded-full px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              Expense flow
            </Badge>
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
