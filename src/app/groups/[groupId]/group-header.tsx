'use client'

import { GroupDesktopNav } from '@/components/layout/group-shell-nav'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, Settings2, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentGroup } from './current-group-context'

export const GroupHeader = () => {
  const { isLoading, groupId, group } = useCurrentGroup()
  const t = useTranslations()
  const pathname = usePathname()

  const participantCount = group?.participants.length ?? 0
  const currencyCode = group?.currencyCode ?? group?.currency ?? 'ARS'
  const isCreateExpense = pathname.endsWith('/expenses/create')

  return (
    <section className="page-panel overflow-hidden">
      <div className="border-b border-black/5 px-5 py-5 dark:border-white/10 md:px-8 md:py-7">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="hero-kicker">Grupo activo</p>
              {isLoading ? (
                <Skeleton className="h-12 w-56 rounded-full" />
              ) : (
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl">{group?.name}</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Vista operativa del grupo: gastos, deudas y liquidaciones en
                    un solo flujo.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-black/5 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <Users className="h-4 w-4" />
                <span>{participantCount} participantes</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-black/5 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
                <ArrowUpRight className="h-4 w-4" />
                <span>Moneda base {currencyCode}</span>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-black/10 bg-transparent px-4 dark:border-white/15"
              >
                <Link href={`/groups/${groupId}/edit`}>
                  <Settings2 className="h-4 w-4" />
                  <span className="ml-2">{t('Settings.title')}</span>
                </Link>
              </Button>
              {!isCreateExpense && (
                <Button asChild className="h-11 rounded-full px-5">
                  <Link href={`/groups/${groupId}/expenses/create`}>
                    Nuevo gasto
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <GroupDesktopNav groupId={groupId} />
        </div>
      </div>
    </section>
  )
}
