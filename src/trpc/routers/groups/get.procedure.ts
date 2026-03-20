import { getGroup } from '@/lib/groups'
import { getUserGroupMembership } from '@/lib/user-memberships'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const getGroupProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    const group = await getGroup(groupId)
    const membership = ctx.auth.user
      ? await getUserGroupMembership(ctx.auth.user.id, groupId)
      : null
    return {
      group,
      currentActiveParticipantId: membership?.activeParticipantId ?? null,
    }
  })
