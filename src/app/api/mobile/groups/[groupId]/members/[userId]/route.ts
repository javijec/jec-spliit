import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { getUserGroupMembership, removeUserFromGroup } from '@/lib/user-memberships'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; userId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId, userId } = await params
    const membership = await getUserGroupMembership(user.id, groupId)

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the group owner can manage users.' },
        { status: 403 },
      )
    }

    await removeUserFromGroup(groupId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to remove member.',
      },
      { status: 400 },
    )
  }
}
