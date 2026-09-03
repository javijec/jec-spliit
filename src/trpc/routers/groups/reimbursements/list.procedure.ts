import { getGroupReimbursements } from '@/lib/reimbursements'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'
import { requireGroupMembership } from '../authorization'

export const listGroupReimbursementsProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input }) => {
    await requireGroupMembership(ctx.auth.user.id, input.groupId)
    return { reimbursements: await getGroupReimbursements(input.groupId) }
  })
