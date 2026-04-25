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
  return expenses.reduce((result: GroupedExpenses, expense: ExpensesType[number]) => {
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

async function syncPersistedActiveUser(
  groupId: string,
  participants: { id: string; name: string }[],
  setActiveParticipant: (input: {
    groupId: string
    participantId: string | null
  }) => Promise<unknown>,
) {
  const activeUser = localStorage.getItem('newGroup-activeUser')
  const newUser = localStorage.getItem(`${groupId}-newUser`)
  if (!activeUser && !newUser) return

  localStorage.removeItem('newGroup-activeUser')
  localStorage.removeItem(`${groupId}-newUser`)

  if (activeUser === 'None') {
    await setActiveParticipant({ groupId, participantId: null })
    return
  }

  const selectedName = activeUser || newUser
  const selectedParticipantId = participants.find(
    (participant) => participant.name === selectedName,
  )?.id
  if (selectedParticipantId) {
    await setActiveParticipant({ groupId, participantId: selectedParticipantId })
  }
}

function EmptyExpenses({ groupId }: { groupId: string }) {
  const t = useTranslations('Expenses')

  return (
    <div className="px-4 py-6 sm:px-6">
      <EmptyState
        icon={Wallet}
        title={t('noExpenses')}
        description={t('noEntriesYet')}
        className="rounded-[1.35rem] border-border/70 bg-card p-7 shadow-[0_14px_34px_hsl(var(--foreground)/0.05)]"
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

function ExpenseListSummary({
  expenseCount,
  reimbursementCount,
}: {
  expenseCount: number
  reimbursementCount: number
}) {
  const t = useTranslations('Expenses')

  return (
    <div className="hidden flex-wrap gap-2 px-4 py-2 sm:flex sm:px-5">
      <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.7rem] font-medium text-foreground">
        {expenseCount} {t('title').toLowerCase()}
      </span>
      <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
        {reimbursementCount} reembolsos
      </span>
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
  const groupCurrency = useMemo(
    () => (group ? getCurrencyFromGroup(group) : null),
    [group],
  )

  if (!group || !groupCurrency) return null

  return (
    <>
      {EXPENSE_GROUP_ORDER.map((expenseGroup) => {
        const expensesInGroup = groupedExpenses[expenseGroup]
        if (!expensesInGroup || expensesInGroup.length === 0) return null

        return (
          <div key={expenseGroup} className="space-y-1.5">
            <div className="px-3 pt-1 sm:px-5">
              <div className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
                {t(`Groups.${expenseGroup}`)}
              </div>
            </div>
            {expensesInGroup.map((expense: ExpensesType[number]) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currency={groupCurrency}
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
  const { groupId, group, viewer } = useCurrentGroup()
  const utils = trpc.useUtils()
  const setActiveParticipant = trpc.groups.setActiveParticipant.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.groups.get.invalidate({ groupId }),
        utils.groups.getDetails.invalidate({ groupId }),
      ])
    },
  })

  useEffect(() => {
    if (!group?.participants) return

    if (viewer) {
      void syncPersistedActiveUser(
        groupId,
        group.participants,
        async ({ groupId, participantId }) =>
          setActiveParticipant.mutateAsync({ groupId, participantId }),
      )
      return
    }

    syncActiveUser(groupId, group.participants)
  }, [groupId, group?.participants, setActiveParticipant, viewer])

  return <ExpenseListContent groupId={groupId} />
}

function ExpenseListContent({ groupId }: { groupId: string }) {
  const { group } = useCurrentGroup()
  const { ref: loadingRef, inView } = useInView()

  const { data, isLoading: expensesAreLoading, fetchNextPage } =
    trpc.groups.expenses.list.useInfiniteQuery(
      { groupId, limit: PAGE_SIZE, filter: '' },
      {
        getNextPageParam: ({ nextCursor }) => nextCursor,
        staleTime: 60 * 1000,
      },
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
  const reimbursementCount = useMemo(
    () => expenses?.filter((expense) => expense.isReimbursement).length ?? 0,
    [expenses],
  )

  if (isLoading) return <ExpensesLoading />
  if (expenses.length === 0) return <EmptyExpenses groupId={groupId} />

  return (
    <div className="space-y-3 px-0 pb-1">
      <ExpenseListSummary
        expenseCount={expenses.length}
        reimbursementCount={reimbursementCount}
      />
      <ExpensesByGroup groupedExpenses={groupedExpenses} groupId={groupId} />
      {hasMore && <ExpensesLoading ref={loadingRef} />}
    </div>
  )
}

const ExpensesLoading = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="space-y-4 px-3 py-3 sm:px-5">
      {[0, 1].map((groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-sm" />
          {[0, 1].map((index) => (
            <div
              key={`${groupIndex}-${index}`}
              className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-4 py-3 text-sm shadow-sm shadow-black/5"
            >
              <div className="pt-0.5">
                <Skeleton className="h-4 w-4 rounded-sm" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 rounded-sm" />
                <Skeleton className="h-4 w-36 rounded-sm" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-4 w-16 rounded-sm" />
                <Skeleton className="h-4 w-20 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
})
ExpensesLoading.displayName = 'ExpensesLoading'
