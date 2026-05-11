import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { createGroup } from '@/lib/groups'
import { mapMobileGroupSummary } from '@/lib/mobile-responses'
import { groupFormSchema } from '@/lib/schemas'
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAppUser(request)
    const payload = (await request.json()) as {
      name?: string
      information?: string
      currency?: string
      currencyCode?: string
      participants?: Array<{ name?: string }>
      activeParticipantName?: string | null
    }

    const parsed = groupFormSchema.safeParse({
      name: payload.name ?? '',
      information: payload.information ?? '',
      currency: payload.currency ?? '',
      currencyCode: payload.currencyCode ?? '',
      participants: (payload.participants ?? []).map((participant) => ({
        name: participant.name ?? '',
      })),
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid group payload.',
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const group = await createGroup(parsed.data, {
      userId: user.id,
      activeParticipantName: payload.activeParticipantName ?? undefined,
      linkedUserName: user.displayName ?? user.email ?? undefined,
    })

    return NextResponse.json({
      groupId: group.id,
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Failed to create group.' }, { status: 500 })
  }
}
