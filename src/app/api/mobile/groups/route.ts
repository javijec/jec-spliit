import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { mapMobileGroupSummary } from '@/lib/mobile-responses'
import { getUserGroups } from '@/lib/user-memberships'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAppUser(request)
    const groups = await getUserGroups(user.id)
    return NextResponse.json({
      groups: groups.map(mapMobileGroupSummary),
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Failed to list groups.' }, { status: 500 })
  }
}
