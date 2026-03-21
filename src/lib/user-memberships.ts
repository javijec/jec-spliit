import { randomId } from '@/lib/ids'
import { prisma } from '@/lib/prisma'
import { GroupRole } from '@prisma/client'

export async function getUserGroups(userId: string) {
  return (
    await prisma.userGroupMembership.findMany({
      where: { userId },
      orderBy: [
        { isStarred: 'desc' },
        { isArchived: 'asc' },
        { lastAccessedAt: 'desc' },
      ],
      select: {
        isArchived: true,
        isStarred: true,
        lastAccessedAt: true,
        group: {
          select: {
            id: true,
            name: true,
            currency: true,
            createdAt: true,
            information: true,
            currencyCode: true,
            _count: { select: { participants: true } },
          },
        },
      },
    })
  ).map((membership) => ({
    ...membership.group,
    createdAt: membership.group.createdAt.toISOString(),
    isArchived: membership.isArchived,
    isStarred: membership.isStarred,
    lastAccessedAt: membership.lastAccessedAt.toISOString(),
  }))
}

export async function getUserGroupMembership(userId: string, groupId: string) {
  return prisma.userGroupMembership.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: {
      groupId: true,
      activeParticipantId: true,
      isArchived: true,
      isStarred: true,
      role: true,
    },
  })
}

export async function saveGroupToUser(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  })
  if (!group) {
    throw new Error(`Invalid group ID: ${groupId}`)
  }

  await prisma.userGroupMembership.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    create: {
      id: randomId(),
      userId,
      groupId,
      role: GroupRole.MEMBER,
      lastAccessedAt: new Date(),
    },
    update: {
      lastAccessedAt: new Date(),
    },
  })

  return group
}

export async function syncUserGroupsFromLegacyState(
  userId: string,
  input: {
    recentGroups: Array<{ id: string; name: string }>
    starredGroupIds: string[]
    archivedGroupIds: string[]
  },
) {
  if (input.recentGroups.length === 0) {
    return { importedCount: 0 }
  }

  const validGroups = await prisma.group.findMany({
    where: {
      id: { in: input.recentGroups.map((group) => group.id) },
    },
    select: { id: true },
  })
  const validGroupIds = new Set(validGroups.map((group) => group.id))

  const memberships = input.recentGroups
    .filter((group) => validGroupIds.has(group.id))
    .map((group) =>
      prisma.userGroupMembership.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId: group.id,
          },
        },
        create: {
          id: randomId(),
          userId,
          groupId: group.id,
          role: GroupRole.MEMBER,
          isStarred: input.starredGroupIds.includes(group.id),
          isArchived: input.archivedGroupIds.includes(group.id),
          lastAccessedAt: new Date(),
        },
        update: {
          isStarred: input.starredGroupIds.includes(group.id),
          isArchived: input.archivedGroupIds.includes(group.id),
          lastAccessedAt: new Date(),
        },
      }),
    )

  await prisma.$transaction(memberships)

  return { importedCount: memberships.length }
}

export async function updateUserGroupMembership(
  userId: string,
  groupId: string,
  input: {
    isStarred?: boolean
    isArchived?: boolean
    activeParticipantId?: string | null
  },
) {
  if (input.activeParticipantId) {
    const participant = await prisma.participant.findFirst({
      where: {
        id: input.activeParticipantId,
        groupId,
      },
      select: { id: true },
    })

    if (!participant) {
      throw new Error(`Invalid participant ID: ${input.activeParticipantId}`)
    }
  }

  return prisma.userGroupMembership.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    create: {
      id: randomId(),
      userId,
      groupId,
      role: GroupRole.MEMBER,
      isStarred: input.isStarred ?? false,
      isArchived: input.isArchived ?? false,
      activeParticipantId:
        input.activeParticipantId === undefined ? null : input.activeParticipantId,
      lastAccessedAt: new Date(),
    },
    update: {
      ...(input.isStarred !== undefined ? { isStarred: input.isStarred } : {}),
      ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      ...(input.activeParticipantId !== undefined
        ? { activeParticipantId: input.activeParticipantId }
        : {}),
      lastAccessedAt: new Date(),
    },
  })
}

export async function setUserActiveParticipant(
  userId: string,
  groupId: string,
  participantId: string | null,
  linkedUserName?: string,
) {
  if (participantId === null) {
    await prisma.$transaction([
      prisma.participant.updateMany({
        where: {
          groupId,
          appUserId: userId,
        },
        data: {
          appUserId: null,
        },
      }),
      prisma.userGroupMembership.upsert({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        create: {
          id: randomId(),
          userId,
          groupId,
          role: GroupRole.MEMBER,
          activeParticipantId: null,
          lastAccessedAt: new Date(),
        },
        update: {
          activeParticipantId: null,
          lastAccessedAt: new Date(),
        },
      }),
    ])

    return
  }

  const participant = await prisma.participant.findFirst({
    where: {
      id: participantId,
      groupId,
    },
    select: { id: true },
  })
  if (!participant) {
    throw new Error(`Invalid participant ID: ${participantId}`)
  }

  await prisma.$transaction([
    prisma.participant.updateMany({
      where: {
        groupId,
        appUserId: userId,
        id: { not: participantId },
      },
      data: {
        appUserId: null,
      },
    }),
    prisma.participant.update({
      where: { id: participantId },
      data: {
        appUserId: userId,
        ...(linkedUserName ? { name: linkedUserName } : {}),
      },
    }),
    prisma.userGroupMembership.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      create: {
        id: randomId(),
        userId,
        groupId,
        role: GroupRole.MEMBER,
        activeParticipantId: participantId,
        lastAccessedAt: new Date(),
      },
      update: {
        activeParticipantId: participantId,
        lastAccessedAt: new Date(),
      },
    }),
  ])
}

export async function removeUserGroupMembership(userId: string, groupId: string) {
  await prisma.userGroupMembership.deleteMany({
    where: {
      userId,
      groupId,
    },
  })
}
