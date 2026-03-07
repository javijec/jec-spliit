'use client'

import { ExpenseCard } from '@/app/groups/[groupId]/expenses/expense-card'
import { getGroupExpensesAction } from '@/app/groups/[groupId]/expenses/expense-list-fetch-action'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import dayjs, { type Dayjs } from 'dayjs'
import { Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { forwardRef, useEffect, useMemo } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCurrentGroup } from '../current-group-context'

const PAGE_SIZE = 20
const EXPENSE_GROUP_ORDER = [
  'upcoming',
  'thisWeek',
  'earlierThisMonth',
  'lastMonth',
  'earlierThisYear',
  'lastYear',
  'older',
] as const

type ExpensesType = NonNullable<Awaited<ReturnType<typeof getGroupExpensesAction>>>
type ExpenseGroupKey = (typeof EXPENSE_GROUP_ORDER)[number]
type GroupedExpenses = Partial<Record<ExpenseGroupKey, ExpensesType>>

function getExpenseGroup(date: Dayjs, today: Dayjs): ExpenseGroupKey {
  if (today.isBefore(date)) return 'upcoming'
  if (today.isSame(date, 'week')) return 'thisWeek'
  if (today.isSame(date, 'month')) return 'earlierThisMonth'
  if (today.subtract(1, 'month').isSame(date, 'month')) return 'lastMonth'
  if (today.isSame(date, 'year')) return 'earlierThisYear'
  if (today.subtract(1, 'year').isSame(date, 'year')) return 'lastYear'
  return 'older'
}

function groupExpensesByDate(expenses: ExpensesType): GroupedExpenses {
  const today = dayjs()
  return expenses.reduce<GroupedExpenses>((result, expense) => {
    const groupKey = getExpenseGroup(dayjs(expense.expenseDate), today)
    result[groupKey] = result[groupKey] ?? []
    result[groupKey]!.push(expense)
    return result
  }, {})
}

function syncActiveUser(groupId: string, participants?: { id: string; name: string }[]) {
  if (!participants) return

  const activeUser = localStorage.getItem('newGroup-activeUser')
  const newUser = localStorage.getItem(`${groupId}-newUser`)
  if (!activeUser && !newUser) return

  localStorage.removeItem('newGroup-activeUser')
  localStorage.removeItem(`${groupId}-newUser`)

  if (activeUser === 'None') {
    localStorage.setItem(`${groupId}-activeUser`, 'None')
    return
  }

  const selectedName = activeUser || newUser
  const selectedParticipantId = participants.find(
    (participant) => participant.name === selectedName,
  )?.id
  if (selectedParticipantId) {
    localStorage.setItem(`${groupId}-activeUser`, selectedParticipantId)
  }
}

function EmptyExpenses({ groupId }: { groupId: string }) {
  const t = useTranslations('Expenses')

  return (
    <div className="px-4 sm:px-6 py-6">
      <EmptyState
        icon={Wallet}
        title={t('noExpenses')}
        description={t('noEntriesYet')}
        action={
          <Button asChild>
            <Link href={`/groups/${groupId}/expenses/create`}>
              {t('createFirst')}
            </Link>
          </Button>
        }
      />
    </div>
  )
}

function ExpensesByGroup({
  groupedExpenses,
  groupId,
}: {
  groupedExpenses: GroupedExpenses
  groupId: string
}) {
  const t = useTranslations('Expenses')
  const { group } = useCurrentGroup()

  if (!group) return null

  return (
    <>
      {EXPENSE_GROUP_ORDER.map((expenseGroup) => {
        const expensesInGroup = groupedExpenses[expenseGroup]
        if (!expensesInGroup || expensesInGroup.length === 0) return null

        return (
          <div key={expenseGroup}>
            <div className="text-muted-foreground text-[11px] sm:text-xs pl-4 sm:pl-6 py-1.5 font-semibold uppercase tracking-wide bg-card border-b">
              {t(`Groups.${expenseGroup}`)}
            </div>
            {expensesInGroup.map((expense, index) => (
              <ExpenseCard
                key={`${expenseGroup}-${expense.id}-${index}`}
                expense={expense}
                currency={getCurrencyFromGroup(group)}
                groupId={groupId}
              />
            ))}
          </div>
        )
      })}
    </>
  )
}

export function ExpenseList() {
  const { groupId, group } = useCurrentGroup()

  useEffect(() => {
    syncActiveUser(groupId, group?.participants)
  }, [groupId, group?.participants])

  return <ExpenseListContent groupId={groupId} />
}

function ExpenseListContent({ groupId }: { groupId: string }) {
  const utils = trpc.useUtils()
  const { group } = useCurrentGroup()
  const { ref: loadingRef, inView } = useInView()

  useEffect(() => {
    // Until we use tRPC more widely and can invalidate the cache on expense
    // update, it's easier and safer to invalidate the cache on page load.
    utils.groups.expenses.invalidate()
  }, [utils])

  const { data, isLoading: expensesAreLoading, fetchNextPage } =
    trpc.groups.expenses.list.useInfiniteQuery(
      { groupId, limit: PAGE_SIZE, filter: '' },
      { getNextPageParam: ({ nextCursor }) => nextCursor },
    )

  const expenses = data?.pages.flatMap((page) => page.expenses)
  const hasMore = data?.pages.at(-1)?.hasMore ?? false
  const isLoading = expensesAreLoading || !expenses || !group

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasMore, inView, isLoading])

  const groupedExpenses = useMemo(
    () => (expenses ? groupExpensesByDate(expenses) : {}),
    [expenses],
  )

  if (isLoading) return <ExpensesLoading />
  if (expenses.length === 0) return <EmptyExpenses groupId={groupId} />

  return (
    <>
      <ExpensesByGroup groupedExpenses={groupedExpenses} groupId={groupId} />
      {hasMore && <ExpensesLoading ref={loadingRef} />}
    </>
  )
}

const ExpensesLoading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="space-y-4 px-4 sm:px-6">
      {[0, 1].map((groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-full" />
          {[0, 1].map((index) => (
            <div
              key={`${groupIndex}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border bg-card/60 px-4 py-4 text-sm"
            >
              <div className="pt-0.5">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-36 rounded-full" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
})
ExpensesLoading.displayName = 'ExpensesLoading'
