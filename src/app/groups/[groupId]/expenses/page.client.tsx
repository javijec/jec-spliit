'use client'

import { ActiveUserModal } from '@/app/groups/[groupId]/expenses/active-user-modal'
import { CreateFromReceiptButton } from '@/app/groups/[groupId]/expenses/create-from-receipt-button'
import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import ExportButton from '@/app/groups/[groupId]/export-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrency, type Currency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { Plus } from 'lucide-react'
import { Metadata } from 'next'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import { useCurrentGroup } from '../current-group-context'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Expenses',
}

export default function GroupExpensesPageClient({
  enableReceiptExtract,
}: {
  enableReceiptExtract: boolean
}) {
  const t = useTranslations('Expenses')
  const locale = useLocale()
  const { groupId, group } = useCurrentGroup()
  const { data: balancesData, isLoading: balancesAreLoading } =
    trpc.groups.balances.list.useQuery(
      { groupId },
      {
        enabled: !!group,
      },
    )
  const groupedDebtSummary = useMemo(() => {
    if (!balancesData) return []
    const pairs = new Map<
      string,
      {
        from: string
        to: string
        currencies: Map<string, number>
      }
    >()

    for (const reimbursement of balancesData.reimbursements) {
      const key = `${reimbursement.from}__${reimbursement.to}`
      if (!pairs.has(key)) {
        pairs.set(key, {
          from: reimbursement.from,
          to: reimbursement.to,
          currencies: new Map(),
        })
      }
      const pair = pairs.get(key)!
      pair.currencies.set(
        reimbursement.currencyCode,
        (pair.currencies.get(reimbursement.currencyCode) ?? 0) +
          reimbursement.amount,
      )
    }

    return Array.from(pairs.values()).map((pair) => ({
      ...pair,
      items: Array.from(pair.currencies.entries())
        .map(([currencyCode, amount]) => ({ currencyCode, amount }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    }))
  }, [balancesData])

  const getParticipantName = (id: string) =>
    group?.participants.find((p) => p.id === id)?.name ?? id

  const resolveCurrency = (currencyCode: string): Currency =>
    group?.currencyCode === currencyCode
      ? getCurrency(group.currencyCode)
      : getCurrency(currencyCode)

  return (
    <>
      {group && (
        <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6 border-b">
            <CardTitle className="text-xl leading-none">Deudas</CardTitle>
            <CardDescription className="mt-2">
              Quién le debe a quién, separado por moneda.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {balancesAreLoading || !balancesData ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : groupedDebtSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay deudas simplificadas pendientes.
              </p>
            ) : (
              <div className="space-y-2.5">
                {groupedDebtSummary.map((pair) => (
                  <div
                    key={`${pair.from}-${pair.to}`}
                    className="rounded-lg border bg-card/60 p-3 sm:p-3.5 text-sm"
                  >
                    <div className="leading-snug">
                      <span className="font-semibold break-words">
                        {getParticipantName(pair.from)}
                      </span>{' '}
                      <span className="text-muted-foreground">debe a</span>{' '}
                      <span className="font-semibold break-words">
                        {getParticipantName(pair.to)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pair.items.map((item) => (
                        <span
                          key={`${pair.from}-${pair.to}-${item.currencyCode}`}
                          className="inline-flex items-center rounded-full border bg-muted/60 px-2 py-0.5 text-xs tabular-nums"
                        >
                          {formatCurrency(
                            resolveCurrency(item.currencyCode),
                            item.amount,
                            locale,
                          )}
                          <span className="ml-1 text-muted-foreground uppercase">
                            {item.currencyCode}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-xl leading-none">{t('title')}</CardTitle>
              <CardDescription className="mt-2">{t('description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto">
              <ExportButton
                groupId={groupId}
                showLabel
                size="default"
                variant="outline"
              />
              {enableReceiptExtract && <CreateFromReceiptButton />}
              <Button
                asChild
                size="default"
                className="ml-auto sm:ml-0 sm:px-3"
              >
                <Link
                  href={`/groups/${groupId}/expenses/create`}
                  title={t('create')}
                >
                  <Plus className="w-4 h-4" />
                  <span className="ml-2">{t('create')}</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pb-4 sm:pb-6 flex flex-col gap-4 relative">
          <ExpenseList />
        </CardContent>
      </Card>

      <ActiveUserModal groupId={groupId} />
    </>
  )
}
