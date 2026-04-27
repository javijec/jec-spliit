import { clearGroupAccessPassword } from '@/lib/groups'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupOwner } from './authorization'
import { z } from 'zod'

export const clearGroupAccessPasswordProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, participantId } }) => {
    await requireGroupOwner(ctx.auth.user.id, groupId)
    await clearGroupAccessPassword(groupId, participantId)
  })
