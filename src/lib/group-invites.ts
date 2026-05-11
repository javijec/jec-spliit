import { getCurrentAppUser } from '@/lib/auth'
import { env } from '@/lib/env'
import { randomId } from '@/lib/ids'
import { getUniqueParticipantName } from '@/lib/participants'
import { prisma } from '@/lib/prisma'
import { GroupRole, Prisma } from '@prisma/client'

const GROUP_INVITE_TTL_DAYS = 14

function buildInviteExpiresAt() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + GROUP_INVITE_TTL_DAYS)
  return expiresAt
}

export function buildGroupInviteUrl(inviteId: string) {
  return new URL(`/invite/${inviteId}`, env.NEXT_PUBLIC_BASE_URL).toString()
}

type CreateGroupInviteInput = {
  groupId: string
  createdByUserId: string
  participantId?: string | null
  newParticipantName?: string | null
}

export async function createGroupInvite(input: CreateGroupInviteInput) {
  const trimmedNewParticipantName = input.newParticipantName?.trim() ?? ''
  const hasParticipantId = !!input.participantId
  const hasNewParticipantName = trimmedNewParticipantName.length >= 2

  if (hasParticipantId === hasNewParticipantName) {
    throw new Error(
      'Invite must target either an existing participant or a new participant.',
    )
  }

  return prisma.$transaction(async (tx) => {
    if (input.participantId) {
      const participant = await tx.participant.findFirst({
        where: {
          id: input.participantId,
          groupId: input.groupId,
        },
        select: {
          id: true,
          name: true,
          appUserId: true,
        },
      })
      if (!participant) {
        throw new Error(`Invalid participant ID: ${input.participantId}`)
      }
      if (participant.appUserId) {
        throw new Error('This participant already has linked access.')
      }
    }

    const invite = await tx.groupInvite.create({
      data: {
        id: randomId(),
        groupId: input.groupId,
        participantId: input.participantId ?? null,
        newParticipantName: hasNewParticipantName
          ? trimmedNewParticipantName
          : null,
        createdByUserId: input.createdByUserId,
        role: GroupRole.MEMBER,
        expiresAt: buildInviteExpiresAt(),
      },
      select: {
        id: true,
        groupId: true,
        participantId: true,
        newParticipantName: true,
      },
    })

    return {
      inviteId: invite.id,
      inviteUrl: buildGroupInviteUrl(invite.id),
      groupId: invite.groupId,
      participantId: invite.participantId,
      newParticipantName: invite.newParticipantName,
    }
  })
}

export async function getGroupInvite(inviteId: string) {
  return prisma.groupInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      groupId: true,
      participantId: true,
      newParticipantName: true,
      expiresAt: true,
      acceptedAt: true,
      acceptedByUserId: true,
      participant: {
        select: {
          id: true,
          name: true,
          appUserId: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

async function createParticipantForInvite(
  tx: Prisma.TransactionClient,
  groupId: string,
  userId: string,
  desiredName: string,
) {
  const participantId = randomId()
  const uniqueName = await getUniqueParticipantName(
    tx,
    groupId,
    participantId,
    desiredName,
  )

  return tx.participant.create({
    data: {
      id: participantId,
      groupId,
      name: uniqueName,
      appUserId: userId,
    },
    select: {
      id: true,
      name: true,
    },
  })
}

export async function acceptGroupInvite(
  inviteId: string,
  userId: string,
  linkedUserName?: string,
) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.groupInvite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        groupId: true,
        participantId: true,
        newParticipantName: true,
        acceptedAt: true,
        acceptedByUserId: true,
        expiresAt: true,
      },
    })

    if (!invite) {
      throw new Error('Invitation not found.')
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      throw new Error('Invitation expired.')
    }

    if (invite.acceptedAt && invite.acceptedByUserId !== userId) {
      throw new Error('Invitation already used.')
    }

    const existingMembership = await tx.userGroupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: invite.groupId,
        },
      },
      select: {
        id: true,
        activeParticipantId: true,
        role: true,
      },
    })

    if (invite.participantId) {
      const participant = await tx.participant.findFirst({
        where: {
          id: invite.participantId,
          groupId: invite.groupId,
        },
        select: {
          id: true,
          appUserId: true,
        },
      })

      if (!participant) {
        throw new Error('Invited participant not found.')
      }

      if (participant.appUserId && participant.appUserId !== userId) {
        throw new Error('This invited participant is already linked to another account.')
      }

      const linkedParticipant = await tx.participant.findFirst({
        where: {
          groupId: invite.groupId,
          appUserId: userId,
          id: { not: participant.id },
        },
        select: { id: true },
      })

      if (linkedParticipant) {
        throw new Error('Your account is already linked to another participant in this group.')
      }

      const uniqueName = linkedUserName
        ? await getUniqueParticipantName(
            tx,
            invite.groupId,
            participant.id,
            linkedUserName,
          )
        : null

      await tx.participant.update({
        where: { id: participant.id },
        data: {
          appUserId: userId,
          ...(uniqueName ? { name: uniqueName } : {}),
        },
      })

      await tx.userGroupMembership.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId: invite.groupId,
          },
        },
        create: {
          id: randomId(),
          userId,
          groupId: invite.groupId,
          role: existingMembership?.role ?? GroupRole.MEMBER,
          activeParticipantId: participant.id,
          lastAccessedAt: new Date(),
        },
        update: {
          activeParticipantId: participant.id,
          lastAccessedAt: new Date(),
        },
      })
    } else {
      const linkedParticipant = await tx.participant.findFirst({
        where: {
          groupId: invite.groupId,
          appUserId: userId,
        },
        select: { id: true },
      })

      if (linkedParticipant) {
        throw new Error('Your account is already linked to another participant in this group.')
      }

      const desiredName =
        invite.newParticipantName || linkedUserName || 'Participante'

      const participant = await createParticipantForInvite(
        tx,
        invite.groupId,
        userId,
        desiredName,
      )

      await tx.userGroupMembership.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId: invite.groupId,
          },
        },
        create: {
          id: randomId(),
          userId,
          groupId: invite.groupId,
          role: existingMembership?.role ?? GroupRole.MEMBER,
          activeParticipantId: participant.id,
          lastAccessedAt: new Date(),
        },
        update: {
          activeParticipantId: participant.id,
          lastAccessedAt: new Date(),
        },
      })
    }

    await tx.groupInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        acceptedByUserId: userId,
      },
    })

    return {
      groupId: invite.groupId,
    }
  })
}

export async function acceptInviteForCurrentUser(inviteId: string) {
  const user = await getCurrentAppUser()
  if (!user) {
    throw new Error('Authentication required.')
  }

  return acceptGroupInvite(
    inviteId,
    user.id,
    user.displayName ?? user.email ?? undefined,
  )
}
