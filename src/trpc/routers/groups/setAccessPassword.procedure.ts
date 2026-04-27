import { setGroupAccessPassword } from '@/lib/groups'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupOwner } from './authorization'
import { z } from 'zod'

export const setGroupAccessPasswordProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      password: z.string().min(4),
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, password, participantId } }) => {
    await requireGroupOwner(ctx.auth.user.id, groupId)
    await setGroupAccessPassword(groupId, password, participantId)
  })
