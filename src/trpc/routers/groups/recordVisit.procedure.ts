import { saveGroupToUser } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const recordGroupVisitProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input: { groupId } }) => {
    const group = await saveGroupToUser(ctx.auth.user.id, groupId)
    return { group }
  })
