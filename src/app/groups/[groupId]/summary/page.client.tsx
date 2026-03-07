'use client'

import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrency, type Currency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import {
  ArrowRight,
  HandCoins,
  Layers3,
  ReceiptText,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import { useCurrentGroup } from '../current-group-context'

type DebtPair = {
  from: string
  to: string
  items: Array<{ currencyCode: string; amount: number }>
}

function useGroupedDebtSummary(groupId: string) {
  const { data: balancesData, isLoading } = trpc.groups.balances.list.useQuery({
    groupId,
  })

  const groupedDebtSummary = useMemo<DebtPair[]>(() => {
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
      from: pair.from,
      to: pair.to,
      items: Array.from(pair.currencies.entries())
        .map(([currencyCode, amount]) => ({ currencyCode, amount }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)),
    }))
  }, [balancesData])

  return {
    groupedDebtSummary,
    isLoading: isLoading || !balancesData,
  }
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof Wallet
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 transition-colors hover:bg-card"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-none">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

export function SummaryPageClient() {
  const tExpenses = useTranslations('Expenses')
  const tBalances = useTranslations('Balances')
  const tSettings = useTranslations('Settings')
  const tSummary = useTranslations('Summary')
  const locale = useLocale()
  const { groupId, group } = useCurrentGroup()
  const { groupedDebtSummary, isLoading } = useGroupedDebtSummary(groupId)
  const debtCurrencyCount = new Set(
    groupedDebtSummary.flatMap((pair) => pair.items.map((item) => item.currencyCode)),
  ).size

  const getParticipantName = (id: string) =>
    group?.participants.find((participant) => participant.id === id)?.name ?? id

  const resolveCurrency = (currencyCode: string): Currency =>
    group?.currencyCode === currencyCode
      ? getCurrency(group.currencyCode)
      : getCurrency(currencyCode)

  return (
    <div className="space-y-4">
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {tSummary('participantsBadge', {
                count: group?.participants.length ?? 0,
              })}
            </span>
            {group?.currencyCode && (
              <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                {tSummary('defaultCurrencyBadge', {
                  currencyCode: group.currencyCode,
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5" />
              {groupedDebtSummary.length > 0
                ? tSummary('pendingPairsBadge', { count: groupedDebtSummary.length })
                : tSummary('settledBadge')}
            </span>
          </div>
          <GroupSectionTitle className="mt-3 text-xl leading-none">
            {tSummary('title')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {tSummary('description')}
          </GroupSectionDescription>
        </GroupSectionHeader>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            {tSummary('quickActionsTitle')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {tSummary('quickActionsDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="grid gap-3">
          <QuickLink
            href={`/groups/${groupId}/expenses`}
            icon={ReceiptText}
            title={tExpenses('title')}
            description={tExpenses('description')}
          />
          <QuickLink
            href={`/groups/${groupId}/balances`}
            icon={HandCoins}
            title={tBalances('Reimbursements.settlementsTitle')}
            description={tBalances('Reimbursements.description')}
          />
          <QuickLink
            href={`/groups/${groupId}/settings`}
            icon={Settings}
            title={tSettings('title')}
            description={tSummary('settingsDescription')}
          />
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            {tExpenses('Debts.title')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {tExpenses('Debts.description')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : groupedDebtSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tExpenses('Debts.noPending')}
            </p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {tSummary('pendingPairsBadge', { count: groupedDebtSummary.length })}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {tSummary('currenciesBadge', { count: debtCurrencyCount })}
                </span>
              </div>
              {groupedDebtSummary.map((pair) => (
                <div
                  key={`${pair.from}-${pair.to}`}
                  className="rounded-lg border bg-card/60 p-3 text-sm"
                >
                  <div className="leading-snug">
                    <span className="font-semibold break-words">
                      {getParticipantName(pair.from)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {tExpenses('Debts.owesTo')}
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
    </div>
  )
}
