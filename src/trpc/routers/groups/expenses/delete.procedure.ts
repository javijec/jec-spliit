import { deleteExpense } from '@/lib/expenses'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const deleteGroupExpenseProcedure = protectedProcedure
  .input(
    z.object({
      expenseId: z.string().min(1),
      groupId: z.string().min(1),
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input: { expenseId, groupId, participantId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
    await deleteExpense(groupId, expenseId, participantId)
    return {}
  })
