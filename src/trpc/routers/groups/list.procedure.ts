import { getGroupsForUser } from '@/lib/groups'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const listGroupsProcedure = protectedProcedure
  .input(
    z.object({
      groupIds: z.array(z.string().min(1)),
    }),
  )
  .query(async ({ ctx, input: { groupIds } }) => {
    const groups = await getGroupsForUser(ctx.auth.user.id, groupIds)
    return { groups }
  })
