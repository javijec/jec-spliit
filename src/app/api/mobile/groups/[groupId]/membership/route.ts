import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import {
  getUserGroupMembership,
  removeUserGroupMembership,
  updateUserGroupMembership,
} from '@/lib/user-memberships'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params
    const payload = await request.json()

    const membership = await getUserGroupMembership(user.id, groupId)
    if (!membership) {
      return NextResponse.json({ error: 'Group membership not found.' }, { status: 404 })
    }

    await updateUserGroupMembership(user.id, groupId, {
      isArchived: payload.isArchived,
      isStarred: payload.isStarred,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Failed to update membership.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params

    const membership = await getUserGroupMembership(user.id, groupId)
    if (!membership) {
      return NextResponse.json({ error: 'Group membership not found.' }, { status: 404 })
    }
    if (membership.role === 'OWNER') {
      return NextResponse.json(
        { error: 'The group owner must delete the group or transfer ownership first.' },
        { status: 409 },
      )
    }

    await removeUserGroupMembership(user.id, groupId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Failed to leave group.' }, { status: 500 })
  }
}
