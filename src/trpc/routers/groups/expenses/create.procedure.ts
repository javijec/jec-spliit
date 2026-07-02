import { createExpense } from '@/lib/expenses'
import { notifyGroupExpenseCreated } from '@/lib/push-notifications'
import { expenseFormSchema } from '@/lib/schemas'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const createGroupExpenseProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      expenseFormValues: expenseFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(
    async ({ ctx, input: { groupId, expenseFormValues, participantId } }) => {
      await requireGroupMembership(ctx.auth.user.id, groupId)
      const expense = await createExpense(
        expenseFormValues,
        groupId,
        participantId,
      )
      await notifyGroupExpenseCreated({
        groupId,
        expenseId: expense.id,
        actorUserId: ctx.auth.user.id,
      })
      return { expenseId: expense.id }
    },
  )
