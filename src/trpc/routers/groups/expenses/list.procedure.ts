import {
  getGroupExpenses,
  syncRecurringExpensesForGroupIfDue,
} from '@/lib/expenses'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const listGroupExpensesProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      cursor: z.number().optional(),
      limit: z.number().optional(),
      filter: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input: { groupId, cursor = 0, limit = 10, filter } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
    await syncRecurringExpensesForGroupIfDue(groupId)

    const expenses = await getGroupExpenses(groupId, {
      offset: cursor,
      length: limit + 1,
      filter,
    })
    return {
      expenses: expenses.slice(0, limit).map((expense) => ({
        ...expense,
        expenseDate: new Date(expense.expenseDate),
      })),
      hasMore: !!expenses[limit],
      nextCursor: cursor + limit,
    }
  })
