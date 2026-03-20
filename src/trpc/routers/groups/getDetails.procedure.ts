import {
  getGroup,
  getGroupAccessControl,
} from '@/lib/groups'
import { getGroupExpensesParticipants } from '@/lib/expenses'
import { getUserGroupMembership } from '@/lib/user-memberships'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupDetailsProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    const group = await getGroup(groupId)
    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found.',
      })
    }

    const participantsWithExpenses = await getGroupExpensesParticipants(groupId)
    const accessControl = await getGroupAccessControl(groupId)
    const membership = ctx.auth.user
      ? await getUserGroupMembership(ctx.auth.user.id, groupId)
      : null
    return {
      group,
      participantsWithExpenses,
      hasAccessPassword: accessControl?.hasAccessPassword ?? false,
      currentActiveParticipantId: membership?.activeParticipantId ?? null,
    }
  })
