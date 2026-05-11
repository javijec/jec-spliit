import { getGroup } from '@/lib/groups'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { mapMobileGroupDetail } from '@/lib/mobile-responses'
import {
  backfillLegacyGroupMemberships,
  getGroupMembershipUsers,
  getUserGroupMembership,
  pruneOrphanedGroupMemberships,
} from '@/lib/user-memberships'
import { requireGroupMembership } from '@/trpc/routers/groups/authorization'
import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params

    await requireGroupMembership(user.id, groupId)
    await backfillLegacyGroupMemberships(groupId)
    await pruneOrphanedGroupMemberships(groupId)

    const [group, membership, members] = await Promise.all([
      getGroup(groupId),
      getUserGroupMembership(user.id, groupId),
      getGroupMembershipUsers(groupId),
    ])

    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
    }

    return NextResponse.json({
      group: mapMobileGroupDetail(group, membership, members),
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to load group.' }, { status: 500 })
  }
}
