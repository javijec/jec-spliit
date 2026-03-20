import { syncUserGroupsFromLegacyState } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

const legacyRecentGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
})

export const syncLegacyGroupsProcedure = protectedProcedure
  .input(
    z.object({
      recentGroups: z.array(legacyRecentGroupSchema),
      starredGroupIds: z.array(z.string()),
      archivedGroupIds: z.array(z.string()),
    }),
  )
  .mutation(
    async ({
      ctx,
      input: { recentGroups, starredGroupIds, archivedGroupIds },
    }) => {
      return syncUserGroupsFromLegacyState(ctx.auth.user.id, {
        recentGroups,
        starredGroupIds,
        archivedGroupIds,
      })
    },
  )
