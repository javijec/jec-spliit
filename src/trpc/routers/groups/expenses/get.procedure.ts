import { getExpense, syncRecurringExpensesForGroupIfDue } from '@/lib/expenses'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const getGroupExpenseProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1), expenseId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId, expenseId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
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
