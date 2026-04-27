import {
  getGroup,
} from '@/lib/groups'
import { getGroupExpensesParticipants } from '@/lib/expenses'
import {
  getGroupMembershipUsers,
  getUserGroupMembership,
} from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { requireGroupMembership } from './authorization'
import { z } from 'zod'

export const getGroupDetailsProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
    const group = await getGroup(groupId)
    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found.',
      })
    }

    const participantsWithExpenses = await getGroupExpensesParticipants(groupId)
    const membership = await getUserGroupMembership(ctx.auth.user.id, groupId)
    const members = await getGroupMembershipUsers(groupId)
    return {
      group,
      members,
      participantsWithExpenses,
      currentUserRole: membership?.role ?? null,
      currentActiveParticipantId: membership?.activeParticipantId ?? null,
    }
  })
