import { addUserToGroupByEmail } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupOwner } from './authorization'
import { z } from 'zod'

export const addGroupMemberProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().min(1),
      email: z.string().email(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, participantId, email } }) => {
    await requireGroupOwner(ctx.auth.user.id, groupId)
    const member = await addUserToGroupByEmail(groupId, participantId, email)
    return { member }
  })
