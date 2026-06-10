import { deleteGroup, getGroup, updateGroup } from '@/lib/groups'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { mapMobileGroupDetail } from '@/lib/mobile-responses'
import { groupFormSchema } from '@/lib/schemas'
import {
  backfillLegacyGroupMemberships,
  getGroupMembershipUsers,
  getUserGroupMembership,
  pruneOrphanedGroupMemberships,
} from '@/lib/user-memberships'
import { requireGroupMembership } from '@/trpc/routers/groups/authorization'
import { requireGroupOwner } from '@/trpc/routers/groups/authorization'
import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type MobileGroupUpdateBody = {
  name?: unknown
  information?: unknown
  currency?: unknown
  currencyCode?: unknown
  defaultSplitMode?: unknown
  participants?: unknown
  participantId?: string
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params
    const payload = (await request.json()) as MobileGroupUpdateBody

    await requireGroupOwner(user.id, groupId)

    const groupFormValues = groupFormSchema.parse({
      name: payload.name,
      information: payload.information ?? '',
      currency: payload.currency,
      currencyCode: payload.currencyCode,
      defaultSplitMode: payload.defaultSplitMode,
      participants: payload.participants,
    })

    await updateGroup(groupId, groupFormValues, payload.participantId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to update group.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params

    await requireGroupOwner(user.id, groupId)
    const membership = await getUserGroupMembership(user.id, groupId)

    await deleteGroup(groupId, membership?.activeParticipantId ?? undefined)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ error: 'Failed to delete group.' }, { status: 500 })
  }
}
