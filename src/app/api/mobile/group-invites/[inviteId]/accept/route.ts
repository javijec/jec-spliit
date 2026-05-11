import { acceptGroupInvite } from '@/lib/group-invites'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { inviteId } = await params

    const accepted = await acceptGroupInvite(
      inviteId,
      user.id,
      user.displayName ?? user.email ?? undefined,
    )

    return NextResponse.json(accepted)
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to accept invite.',
      },
      { status: 400 },
    )
  }
}
