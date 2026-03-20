import { removeUserGroupMembership } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const removeGroupMembershipProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input: { groupId } }) => {
    await removeUserGroupMembership(ctx.auth.user.id, groupId)
    return { success: true }
  })
