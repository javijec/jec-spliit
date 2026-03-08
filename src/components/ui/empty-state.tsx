import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border border-dashed bg-background p-6 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center border bg-muted/35 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
