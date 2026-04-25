import { getGroup } from '@/lib/groups'
import {
  getGroupStatsExpenses,
  syncRecurringExpensesForGroupIfDue,
  getTotalGroupSpendingAmount,
} from '@/lib/expenses'
import {
  getTotalActiveUserPaidFor,
  getTotalActiveUserShare,
} from '@/lib/totals'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupStatsProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().optional(),
    }),
  )
  .query(async ({ input: { groupId, participantId } }) => {
    await syncRecurringExpensesForGroupIfDue(groupId)

    const group = await getGroup(groupId)
    if (!group) {
      throw new Error('Invalid group ID')
    }

    const now = new Date()
    const currentUtcYear = now.getUTCFullYear()
    const currentUtcMonth = now.getUTCMonth()
    const firstMonthDate = new Date(
      Date.UTC(currentUtcYear, currentUtcMonth - 5, 1),
    )

    const lastSixMonthsBase = Array.from({ length: 6 }, (_, index) => {
      const monthOffset = 5 - index
      const monthDate = new Date(
        Date.UTC(currentUtcYear, currentUtcMonth - monthOffset, 1),
      )
      return {
        year: monthDate.getUTCFullYear(),
        month: monthDate.getUTCMonth(),
        total: 0,
      }
    })

    const monthlyIndex = new Map(
      lastSixMonthsBase.map((entry, index) => [
        `${entry.year}-${entry.month}`,
        index,
      ]),
    )

    const [totalGroupSpendings, monthlyExpenses, participantExpenses] =
      await Promise.all([
        getTotalGroupSpendingAmount(groupId),
        getGroupStatsExpenses(groupId, { since: firstMonthDate }),
        participantId
          ? getGroupStatsExpenses(groupId, { participantId })
          : Promise.resolve([]),
      ])

    const totalsByCurrency = new Map<string, number[]>()

    for (const expense of monthlyExpenses) {
      if (expense.isReimbursement) continue
      if (expense.amount <= 0) continue
      const expenseDate = new Date(expense.expenseDate)
      const key = `${expenseDate.getUTCFullYear()}-${expenseDate.getUTCMonth()}`
      const index = monthlyIndex.get(key)
      if (index === undefined) continue

      const currencyCode = expense.originalCurrency ?? group.currencyCode ?? 'USD'
      const amountForCurrency = expense.originalAmount ?? expense.amount
      if (!totalsByCurrency.has(currencyCode)) {
        totalsByCurrency.set(currencyCode, Array(6).fill(0))
      }
      totalsByCurrency.get(currencyCode)![index] += amountForCurrency
    }

    const monthlySpendingsLastSixMonthsByCurrency = Array.from(
      totalsByCurrency.entries(),
    ).map(([currencyCode, totals]) => ({
      currencyCode,
      months: lastSixMonthsBase.map((entry, index) => ({
        year: entry.year,
        month: entry.month,
        total: totals[index] ?? 0,
      })),
    }))

    const totalParticipantSpendings =
      participantId !== undefined
        ? getTotalActiveUserPaidFor(participantId, participantExpenses)
        : undefined
    const totalParticipantShare =
      participantId !== undefined
        ? getTotalActiveUserShare(participantId, participantExpenses)
        : undefined

    return {
      totalGroupSpendings,
      totalParticipantSpendings,
      totalParticipantShare,
      monthlySpendingsLastSixMonthsByCurrency,
    }
  })
