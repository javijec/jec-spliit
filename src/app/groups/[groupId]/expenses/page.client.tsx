'use client'

import { ActiveUserModal } from '@/app/groups/[groupId]/expenses/active-user-modal'
import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import ExportButton from '@/app/groups/[groupId]/export-button'
import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrency, type Currency } from '@/lib/currency'
import { formatCurrency, getCurrencyFromGroup } from '@/lib/utils'
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

export default function GroupExpensesPageClient() {
  const t = useTranslations('Expenses')
  const tBalances = useTranslations('Balances')
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

  const LoadingPairs = () => (
    <div className="space-y-2">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  )

  const DebtSection = () => (
    <GroupSectionCard className="lg:mx-0 lg:border-x">
      <GroupSectionHeader>
        <GroupSectionTitle className="text-xl leading-none">
          {t('Debts.title')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {t('Debts.description')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent>
        {balancesAreLoading || !balancesData ? (
          <LoadingPairs />
        ) : groupedDebtSummary.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('Debts.noPending')}
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
                  <span className="text-muted-foreground">
                    {t('Debts.owesTo')}
                  </span>{' '}
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
      </GroupSectionContent>
    </GroupSectionCard>
  )

  const SettlementsSection = () => (
    <GroupSectionCard className="lg:mx-0 lg:border-x">
      <GroupSectionHeader>
        <GroupSectionTitle className="text-xl leading-none">
          {tBalances('Reimbursements.settlementsTitle')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {tBalances('Reimbursements.description')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent>
        {balancesAreLoading || !balancesData ? (
          <LoadingPairs />
        ) : (
          <ReimbursementList
            reimbursements={balancesData.reimbursements}
            participants={group!.participants}
            currency={getCurrencyFromGroup(group!)}
            groupId={groupId}
          />
        )}
      </GroupSectionContent>
    </GroupSectionCard>
  )

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-4">
        <div className="order-2 lg:order-1">
          {group && (
            <div className="mb-4 lg:hidden space-y-4">
              <DebtSection />
              <div className="hidden sm:block">
                <SettlementsSection />
              </div>
            </div>
          )}

          <GroupSectionCard className="mb-4">
            <GroupSectionHeader className="p-3 sm:p-6">
              <div className="space-y-1 sm:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <GroupSectionTitle className="text-lg sm:text-xl leading-none">
                    {t('title')}
                  </GroupSectionTitle>
                  <div className="flex items-center gap-2">
                    <div className="sm:hidden">
                      <ExportButton
                        groupId={groupId}
                        size="icon"
                        variant="outline"
                      />
                    </div>
                    <div className="hidden sm:block">
                      <ExportButton
                        groupId={groupId}
                        showLabel
                        size="default"
                        variant="outline"
                      />
                    </div>
                    <Button
                      asChild
                      size="default"
                      className="hidden sm:inline-flex sm:px-3"
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
                <GroupSectionDescription className="hidden sm:block">
                  {t('description')}
                </GroupSectionDescription>
              </div>
            </GroupSectionHeader>

            <GroupSectionContent className="p-0 pb-4 sm:pb-6 flex flex-col gap-4 relative">
              <ExpenseList />
            </GroupSectionContent>
          </GroupSectionCard>
        </div>

        {group && (
          <aside className="order-1 lg:order-2 hidden lg:block space-y-4 sticky top-20">
            <DebtSection />
            <SettlementsSection />
          </aside>
        )}
      </div>

      <ActiveUserModal groupId={groupId} />
    </>
  )
}
