import { removeUserFromGroup } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupOwner } from './authorization'
import { z } from 'zod'

export const removeGroupMemberProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      userId: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, userId } }) => {
    await requireGroupOwner(ctx.auth.user.id, groupId)
    return removeUserFromGroup(groupId, userId)
  })
