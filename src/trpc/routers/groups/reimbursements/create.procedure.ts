import { notifyGroupExpenseCreated } from '@/lib/push-notifications'
import { createValidatedReimbursement } from '@/lib/reimbursements'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { requireGroupMembership } from '../authorization'

const reimbursementInput = z.object({
  groupId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  currencyCode: z.string().max(3),
  amount: z.number().finite().int().positive(),
  participantId: z.string().min(1).optional(),
})

export const createGroupReimbursementProcedure = protectedProcedure
  .input(reimbursementInput)
  .mutation(async ({ ctx, input }) => {
    await requireGroupMembership(ctx.auth.user.id, input.groupId)

    try {
      const expense = await createValidatedReimbursement(
        input.groupId,
        input,
        input.participantId,
      )
      await notifyGroupExpenseCreated({
        groupId: input.groupId,
        expenseId: expense.id,
        actorUserId: ctx.auth.user.id,
      })
      return { expenseId: expense.id }
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message:
          error instanceof Error ? error.message : 'Invalid reimbursement',
      })
    }
  })
