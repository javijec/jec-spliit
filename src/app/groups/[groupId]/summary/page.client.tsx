'use client'

import { Badge } from '@/components/ui/badge'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrency, type Currency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { HandCoins, Layers3, ShieldCheck, Users, UserRound, Wallet } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
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

export function SummaryPageClient() {
  const tExpenses = useTranslations('Expenses')
  const tSummary = useTranslations('Summary')
  const locale = useLocale()
  const { groupId, group, viewer } = useCurrentGroup()
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
    <div className="space-y-5">
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Users className="h-3.5 w-3.5" />
              {tSummary('participantsBadge', {
                count: group?.participants.length ?? 0,
              })}
            </Badge>
            {group?.currencyCode && (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Wallet className="h-3.5 w-3.5" />
                {tSummary('defaultCurrencyBadge', {
                  currencyCode: group.currencyCode,
                })}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-full px-3 py-1">
              <Layers3 className="h-3.5 w-3.5" />
              {groupedDebtSummary.length > 0
                ? tSummary('pendingPairsBadge', { count: groupedDebtSummary.length })
                : tSummary('settledBadge')}
            </Badge>
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
            {tSummary('participantsBadge', {
              count: group?.participants.length ?? 0,
            })}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {tSummary('participantLinksDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {group?.participants.map((participant) => {
              const isLinked = !!participant.appUserId
              const isCurrentViewer =
                !!participant.appUserId &&
                participant.appUserId === viewer?.id

              return (
                <div
                  key={participant.id}
                  className="rounded-2xl border border-border/70 bg-background/80 px-3.5 py-3 text-sm shadow-sm shadow-black/5"
                >
                  <div className="font-medium tracking-tight">{participant.name}</div>
                  {isLinked && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isCurrentViewer ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-1 text-foreground"
                          title={tSummary('linkedYouBadge')}
                          aria-label={tSummary('linkedYouBadge')}
                        >
                          <UserRound className="h-3.5 w-3.5" />
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-1 text-muted-foreground"
                          title={tSummary('linkedBadge')}
                          aria-label={tSummary('linkedBadge')}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-36 rounded-sm" />
                <Skeleton className="h-6 w-32 rounded-sm" />
              </div>
              <Skeleton className="h-16 w-full rounded-sm" />
              <Skeleton className="h-16 w-full rounded-sm" />
            </div>
          ) : groupedDebtSummary.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title={tSummary('settledBadge')}
              description={tSummary('noPendingDescription')}
            />
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem]">
                  {tSummary('pendingPairsBadge', { count: groupedDebtSummary.length })}
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem]">
                  {tSummary('currenciesBadge', { count: debtCurrencyCount })}
                </Badge>
              </div>
              {groupedDebtSummary.map((pair) => (
                <div
                  key={`${pair.from}-${pair.to}`}
                  className="rounded-2xl border border-border/70 bg-background/85 px-3.5 py-3.5 text-sm shadow-sm shadow-black/5"
                >
                  <div className="leading-snug">
                    <span className="break-words font-semibold">
                      {getParticipantName(pair.from)}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {tExpenses('Debts.owesTo')}
                    </span>{' '}
                    <span className="break-words font-semibold">
                      {getParticipantName(pair.to)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pair.items.map((item) => (
                      <Badge
                        key={`${pair.from}-${pair.to}-${item.currencyCode}`}
                        variant="outline"
                        className="rounded-full px-2.5 py-1 text-xs tabular-nums"
                      >
                        {formatCurrency(
                          resolveCurrency(item.currencyCode),
                          item.amount,
                          locale,
                        )}
                        <span className="ml-1 text-muted-foreground uppercase">
                          {item.currencyCode}
                        </span>
                      </Badge>
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
