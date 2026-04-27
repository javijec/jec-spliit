import { getGroup } from '@/lib/groups'
import { getUserGroupMembership } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from './authorization'
import { z } from 'zod'

export const getGroupProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
    const group = await getGroup(groupId)
    const membership = await getUserGroupMembership(ctx.auth.user.id, groupId)
    return {
      group,
      currentActiveParticipantId: membership?.activeParticipantId ?? null,
    }
  })
