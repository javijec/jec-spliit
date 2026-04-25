import { getExpense, syncRecurringExpensesForGroupIfDue } from '@/lib/expenses'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupExpenseProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1), expenseId: z.string().min(1) }))
  .query(async ({ input: { groupId, expenseId } }) => {
    await syncRecurringExpensesForGroupIfDue(groupId)

    const expense = await getExpense(groupId, expenseId)
    if (!expense) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Expense not found',
      })
    }
    return { expense }
  })
