import * as React from 'react'

import { cn } from '@/lib/utils'

type PageHeaderProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  meta?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <section
      className={cn('border-b border-border/70 pb-4 sm:pb-5', className)}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          {meta ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {meta}
            </div>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[2rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}

type SectionHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  meta?: React.ReactNode
}

export function SectionHeader({
  title,
  description,
  actions,
  meta,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-2">
        {meta ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {meta}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-tight tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
