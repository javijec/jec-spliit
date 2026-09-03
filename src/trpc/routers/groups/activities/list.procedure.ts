import { getActivities } from '@/lib/groups'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'
import { requireGroupMembership } from '../authorization'

export const listGroupActivitiesProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string(),
      cursor: z.number().int().min(0).optional().default(0),
      limit: z.number().int().min(1).max(8).optional().default(5),
    }),
  )
  .query(async ({ ctx, input: { groupId, cursor, limit } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
    const activities = await getActivities(groupId, {
      offset: cursor,
      length: limit + 1,
    })
    return {
      activities: activities.slice(0, limit),
      hasMore: !!activities[limit],
      nextCursor: cursor + limit,
    }
  })
