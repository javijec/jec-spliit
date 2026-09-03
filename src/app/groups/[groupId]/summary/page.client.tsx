'use client'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import type { Locale } from '@/i18n/request'
import { getCurrency } from '@/lib/currency'
import {
  formatCurrency,
  formatDateOnly,
  getCurrencyFromGroup,
} from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import {
  ArrowRight,
  CircleCheck,
  Plus,
  ReceiptText,
  UserRound,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import { useCurrentGroup } from '../current-group-context'
import { QuickExpenseTrigger } from '../quick-expense-drawer'
import { ActivityFeed } from './activity-feed'

type RecentExpense =
  AppRouterOutput['groups']['expenses']['list']['expenses'][number]

type PositionCardsProps = {
  balances: Record<string, number>
  groupCurrencyCode: string | null
  locale: string
  t: ReturnType<typeof useTranslations>
}

function SummaryLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading summary">
      <GroupSectionCard>
        <GroupSectionContent className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </GroupSectionContent>
      </GroupSectionCard>
      <GroupSectionCard>
        <GroupSectionContent className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded bg-muted" />
          ))}
        </GroupSectionContent>
      </GroupSectionCard>
    </div>
  )
}

function PositionCards({
  balances,
  groupCurrencyCode,
  locale,
  t,
}: PositionCardsProps) {
  const entries = Object.entries(balances)
  const currencyCodes = entries.length
    ? entries.map(([currencyCode]) => currencyCode)
    : groupCurrencyCode
      ? [groupCurrencyCode]
      : []

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {currencyCodes.map((currencyCode) => {
        const balance = balances[currencyCode] ?? 0
        const currency = getCurrency(currencyCode, locale as Locale)
        const state = balance > 0 ? 'owed' : balance < 0 ? 'owes' : 'even'
        const label =
          state === 'owed'
            ? t('youAreOwed')
            : state === 'owes'
              ? t('youOwe')
              : t('allEven')

        return (
          <div
            key={currencyCode}
            data-position={state}
            className="rounded-md border border-border/70 bg-background px-3 py-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {currencyCode}
            </p>
            <p className="mt-1 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(currency, Math.abs(balance), locale)}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function RecentExpenseRow({
  expense,
  groupCurrency,
  locale,
  t,
}: {
  expense: RecentExpense
  groupCurrency: ReturnType<typeof getCurrencyFromGroup>
  locale: string
  t: ReturnType<typeof useTranslations>
}) {
  const currencyCode = expense.originalCurrency ?? groupCurrency.code
  const currency = getCurrency(currencyCode, locale as Locale)
  const amount = expense.originalAmount ?? expense.amount

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {expense.isReimbursement ? t('reimbursement') : expense.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t('recentExpensePaidBy', { participant: expense.paidBy.name })}
          {' · '}
          {formatDateOnly(new Date(expense.expenseDate), locale)}
        </p>
      </div>
      <p className="shrink-0 text-sm font-semibold tabular-nums">
        {formatCurrency(currency, amount, locale)}
      </p>
    </li>
  )
}

export function SummaryPageClient() {
  const locale = useLocale()
  const t = useTranslations('Summary')
  const {
    group,
    groupSnapshot,
    groupId,
    currentActiveParticipantId,
    openActiveUserModal,
  } = useCurrentGroup()
  const resolvedGroup = group ?? groupSnapshot?.group ?? null
  const groupCurrency = resolvedGroup
    ? getCurrencyFromGroup(resolvedGroup)
    : null
  const statsQuery = trpc.groups.stats.get.useQuery(
    {
      groupId,
      participantId: currentActiveParticipantId ?? undefined,
    },
    { staleTime: 300_000, refetchOnMount: false },
  )
  const expensesQuery = trpc.groups.expenses.list.useInfiniteQuery(
    { groupId, limit: 5, filter: '', sortBy: 'createdAt' },
    {
      getNextPageParam: (page) => (page.hasMore ? page.nextCursor : undefined),
      staleTime: 300_000,
      refetchOnMount: false,
    },
  )
  const activityQuery = trpc.groups.activities.list.useQuery(
    { groupId, cursor: 0, limit: 6 },
    {
      staleTime: 300_000,
    },
  )
  const recentExpenses = useMemo(
    () => expensesQuery.data?.pages.flatMap((page) => page.expenses) ?? [],
    [expensesQuery.data],
  )

  if (!resolvedGroup || statsQuery.isLoading || expensesQuery.isLoading) {
    return <SummaryLoading />
  }

  const personalBalanceByCurrency =
    statsQuery.data?.personalBalanceByCurrency ?? {}
  const hasExpenses = recentExpenses.length > 0
  const hasActiveParticipant = !!currentActiveParticipantId

  return (
    <div className="space-y-3">
      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle>{t('positionTitle')}</GroupSectionTitle>
          <GroupSectionDescription>
            {t('positionDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          {hasActiveParticipant && !statsQuery.isError ? (
            <PositionCards
              balances={personalBalanceByCurrency}
              groupCurrencyCode={resolvedGroup.currencyCode}
              locale={locale}
              t={t}
            />
          ) : hasActiveParticipant ? (
            <p className="text-sm text-muted-foreground">
              {t('financialError')}
            </p>
          ) : (
            <div className="rounded-md border border-dashed border-border/70 bg-background px-3 py-3">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('chooseParticipant')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('chooseParticipantDescription')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => openActiveUserModal?.()}
                  >
                    {t('chooseParticipant')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle>{t('recentExpensesTitle')}</GroupSectionTitle>
          <GroupSectionDescription>
            {t('recentExpensesDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          {expensesQuery.isError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {t('recentExpensesError')}
            </p>
          ) : hasExpenses && groupCurrency ? (
            <>
              <ol>
                {recentExpenses.map((expense) => (
                  <RecentExpenseRow
                    key={expense.id}
                    expense={expense}
                    groupCurrency={groupCurrency}
                    locale={locale}
                    t={t}
                  />
                ))}
              </ol>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/groups/${groupId}/expenses`}>
                  {t('viewAllExpenses')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <EmptyState
              icon={recentExpenses.length ? ReceiptText : CircleCheck}
              title={t('noExpensesYet')}
              description={t('noExpensesYetDescription')}
              action={
                <QuickExpenseTrigger>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addExpense')}
                </QuickExpenseTrigger>
              }
            />
          )}
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle>{t('recentActivityTitle')}</GroupSectionTitle>
          <GroupSectionDescription>
            {t('recentActivityDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <ActivityFeed
          activities={activityQuery.data?.activities ?? []}
          groupId={groupId}
          groupCurrency={groupCurrency ?? getCurrencyFromGroup(resolvedGroup)}
          isLoading={activityQuery.isLoading}
          isError={activityQuery.isError}
        />
      </GroupSectionCard>
    </div>
  )
}
