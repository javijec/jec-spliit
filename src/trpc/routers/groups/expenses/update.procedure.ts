import { updateExpense } from '@/lib/expenses'
import { expenseFormSchema } from '@/lib/schemas'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const updateGroupExpenseProcedure = protectedProcedure
  .input(
    z.object({
      expenseId: z.string().min(1),
      groupId: z.string().min(1),
      expenseFormValues: expenseFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(
    async ({
      ctx,
      input: { expenseId, groupId, expenseFormValues, participantId },
    }) => {
      await requireGroupMembership(ctx.auth.user.id, groupId)
      const expense = await updateExpense(
        groupId,
        expenseId,
        expenseFormValues,
        participantId,
      )
      return { expenseId: expense.id }
    },
  )
