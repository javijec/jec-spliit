import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GroupSectionCard } from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function GroupsRouteLoading() {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card px-4 py-4 shadow-[0_18px_50px_hsl(var(--foreground)/0.06)] sm:px-5 sm:py-5">
        <div className="relative space-y-4">
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-3/4 max-w-xl" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-11 w-full sm:w-40" />
            <Skeleton className="h-11 w-full sm:w-52" />
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <div>
          <Skeleton className="mb-3 h-6 w-28" />
          <div className="grid gap-3">
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </div>
        </div>

        <div>
          <Skeleton className="mb-3 h-6 w-32" />
          <div className="grid gap-3">
            <GroupCardSkeleton />
            <GroupCardSkeleton />
            <GroupCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

export function GroupRouteLoading() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <GroupSectionLoading />
    </div>
  )
}

export function GroupSectionLoading({
  className,
  rows = 4,
}: {
  className?: string
  rows?: number
}) {
  return (
    <GroupSectionCard className={cn(className)}>
      <div className="border-b border-border/70 px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
      </div>

      <div className="space-y-3 px-4 py-3.5 sm:px-5 sm:py-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm shadow-black/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-2/3 max-w-sm" />
              </div>
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </GroupSectionCard>
  )
}

export function RouteErrorState({
  title,
  description,
  retryLabel = 'Reintentar',
  backHref = '/groups',
  backLabel = 'Volver a grupos',
  onRetry,
}: {
  title: string
  description: string
  retryLabel?: string
  backHref?: string
  backLabel?: string
  onRetry: () => void
}) {
  return (
    <Card className="mx-auto w-full max-w-2xl overflow-hidden">
      <CardHeader>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <CardTitle className="pt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-border/70 bg-background/80 p-3.5 text-sm text-muted-foreground">
          Si el problema persiste, puede haber un fallo temporal de red, permisos o
          base de datos.
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onRetry} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function GroupCardSkeleton() {
  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-card/90 p-4 shadow-[0_12px_28px_hsl(var(--foreground)/0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-40 rounded-sm" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-12 rounded-sm" />
            <Skeleton className="h-4 w-28 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-9 w-9 rounded-sm" />
      </div>
    </div>
  )
}
