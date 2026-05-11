import { createGroupInvite } from '@/lib/group-invites'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { getUserGroupMembership } from '@/lib/user-memberships'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params
    const membership = await getUserGroupMembership(user.id, groupId)

    if (!membership || membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the group owner can create invitations.' },
        { status: 403 },
      )
    }

    const payload = (await request.json()) as {
      participantId?: string | null
      newParticipantName?: string | null
    }

    const invite = await createGroupInvite({
      groupId,
      createdByUserId: user.id,
      participantId: payload.participantId ?? null,
      newParticipantName: payload.newParticipantName ?? null,
    })

    return NextResponse.json(invite)
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create invite.',
      },
      { status: 400 },
    )
  }
}
