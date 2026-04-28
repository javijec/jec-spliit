import {
  backfillLegacyMembershipForUser,
  getUserGroupMembership,
} from '@/lib/user-memberships'
import { TRPCError } from '@trpc/server'

export async function requireGroupMembership(userId: string, groupId: string) {
  const membership =
    (await getUserGroupMembership(userId, groupId)) ??
    (await backfillLegacyMembershipForUser(userId, groupId))
  if (!membership) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this group.',
    })
  }
  return membership
}

export async function requireGroupOwner(userId: string, groupId: string) {
  const membership = await requireGroupMembership(userId, groupId)
  if (membership.role !== 'OWNER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the group owner can perform this action.',
    })
  }
  return membership
}
