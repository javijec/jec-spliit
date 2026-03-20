import { updateUserGroupMembership } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const updateGroupMembershipProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      isStarred: z.boolean().optional(),
      isArchived: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, isArchived, isStarred } }) => {
    await updateUserGroupMembership(ctx.auth.user.id, groupId, {
      isArchived,
      isStarred,
    })
    return { success: true }
  })
