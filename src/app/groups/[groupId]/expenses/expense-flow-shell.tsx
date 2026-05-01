'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
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
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur sm:rounded-lg sm:border sm:bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-xl"
          >
            <Link href={`/groups/${groupId}/expenses`} title={title}>
              <ChevronLeft className="h-4.5 w-4.5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-none">
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-2.5 sm:px-0 sm:py-4">
        {children}
      </div>
    </div>
  )
}
