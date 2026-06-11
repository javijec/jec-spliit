import { randomId } from '@/lib/ids'
import { getUniqueParticipantName } from '@/lib/participants'
import { prisma } from '@/lib/prisma'
import { GroupRole, Prisma } from '@prisma/client'

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
            defaultSplitMode: true,
            defaultSplitShares: true,
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
  const membership = await prisma.userGroupMembership.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    select: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  if (!membership?.group) {
    throw new Error(`User ${userId} is not a member of group ${groupId}`)
  }

  await prisma.userGroupMembership.update({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
    data: {
      lastAccessedAt: new Date(),
    },
  })

  return membership.group
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
    select: { id: true, appUserId: true },
  })
  if (!participant) {
    throw new Error(`Invalid participant ID: ${participantId}`)
  }
  if (participant.appUserId && participant.appUserId !== userId) {
    throw new Error(`Participant already linked to another user: ${participantId}`)
  }

  await prisma.$transaction(async (tx) => {
    await tx.participant.updateMany({
      where: {
        groupId,
        appUserId: userId,
        id: { not: participantId },
      },
      data: {
        appUserId: null,
      },
    })

    const uniqueName = linkedUserName
      ? await getUniqueParticipantName(tx, groupId, participantId, linkedUserName)
      : null

    await tx.participant.update({
      where: { id: participantId },
      data: {
        appUserId: userId,
        ...(uniqueName ? { name: uniqueName } : {}),
      },
    })

    await tx.userGroupMembership.upsert({
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
    })
  })
}

export async function backfillLegacyMembershipForUser(
  userId: string,
  groupId: string,
) {
  return prisma.$transaction(async (tx) => {
    const fetchMembership = () =>
      tx.userGroupMembership.findUnique({
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

    const membership = await fetchMembership()

    if (membership?.activeParticipantId) {
      await ensureLegacyGroupOwner(tx, groupId, userId)
      return fetchMembership()
    }

    const linkedParticipants = await tx.participant.findMany({
      where: {
        groupId,
        appUserId: userId,
      },
      select: {
        id: true,
      },
    })

    if (linkedParticipants.length !== 1) {
      await ensureLegacyGroupOwner(tx, groupId, userId)
      return fetchMembership()
    }

    const activeParticipantId = linkedParticipants[0]!.id

    if (membership) {
      await tx.userGroupMembership.update({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
        data: {
          activeParticipantId,
          lastAccessedAt: new Date(),
        },
        select: {
          groupId: true,
          activeParticipantId: true,
          isArchived: true,
          isStarred: true,
          role: true,
        },
      })
      await ensureLegacyGroupOwner(tx, groupId, userId)
      return fetchMembership()
    }

    await tx.userGroupMembership.create({
      data: {
        id: randomId(),
        userId,
        groupId,
        role: GroupRole.MEMBER,
        activeParticipantId,
        lastAccessedAt: new Date(),
      },
      select: {
        groupId: true,
        activeParticipantId: true,
        isArchived: true,
        isStarred: true,
        role: true,
      },
    })

    await ensureLegacyGroupOwner(tx, groupId, userId)

    return fetchMembership()
  })
}

export async function backfillLegacyGroupMemberships(groupId: string) {
  return prisma.$transaction(async (tx) => {
    const [linkedParticipants, memberships] = await Promise.all([
      tx.participant.findMany({
        where: {
          groupId,
          appUserId: { not: null },
        },
        select: {
          id: true,
          appUserId: true,
          createdAt: true,
        },
      }),
      tx.userGroupMembership.findMany({
        where: { groupId },
        select: {
          userId: true,
          activeParticipantId: true,
          role: true,
          createdAt: true,
        },
      }),
    ])

    const participantIdsByUser = new Map<string, string[]>()
    for (const participant of linkedParticipants) {
      const userId = participant.appUserId
      if (!userId) continue
      participantIdsByUser.set(userId, [
        ...(participantIdsByUser.get(userId) ?? []),
        participant.id,
      ])
    }

    const membershipByUser = new Map(
      memberships.map((membership) => [membership.userId, membership]),
    )
    const updates: Array<Promise<unknown>> = []

    for (const [userId, participantIds] of Array.from(
      participantIdsByUser.entries(),
    )) {
      if (participantIds.length !== 1) continue

      const participantId = participantIds[0]!
      const membership = membershipByUser.get(userId)

      if (!membership) {
        updates.push(
          tx.userGroupMembership.create({
            data: {
              id: randomId(),
              userId,
              groupId,
              role: GroupRole.MEMBER,
              activeParticipantId: participantId,
              lastAccessedAt: new Date(),
            },
          }),
        )
        continue
      }

      if (membership.activeParticipantId === null) {
        updates.push(
          tx.userGroupMembership.update({
            where: {
              userId_groupId: {
                userId,
                groupId,
              },
            },
            data: {
              activeParticipantId: participantId,
              lastAccessedAt: new Date(),
            },
          }),
        )
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates)
    }

    await ensureLegacyGroupOwner(tx, groupId)
  })
}

async function ensureLegacyGroupOwner(
  tx: Prisma.TransactionClient,
  groupId: string,
  preferredUserId?: string,
) {
  const [linkedParticipants, memberships] = await Promise.all([
    tx.participant.findMany({
      where: {
        groupId,
        appUserId: { not: null },
      },
      select: {
        id: true,
        appUserId: true,
        createdAt: true,
      },
    }),
    tx.userGroupMembership.findMany({
      where: { groupId },
      select: {
        userId: true,
        activeParticipantId: true,
        role: true,
        createdAt: true,
      },
    }),
  ])

  if (memberships.some((membership) => membership.role === GroupRole.OWNER)) {
    return
  }

  const participantIdsByUser = new Map<string, string[]>()
  for (const participant of linkedParticipants) {
    const userId = participant.appUserId
    if (!userId) continue
    participantIdsByUser.set(userId, [
      ...(participantIdsByUser.get(userId) ?? []),
      participant.id,
    ])
  }

  const eligibleUsers = Array.from(participantIdsByUser.entries()).filter(
    ([, participantIds]) => participantIds.length === 1,
  )

  if (eligibleUsers.length === 0) {
    return
  }

  const preferredCandidate =
    preferredUserId &&
    eligibleUsers.find(([userId]) => userId === preferredUserId)

  const candidate =
    preferredCandidate ??
    eligibleUsers.sort((left, right) => {
      const leftCreatedAt =
        linkedParticipants.find(
          (participant) => participant.appUserId === left[0],
        )?.createdAt.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightCreatedAt =
        linkedParticipants.find(
          (participant) => participant.appUserId === right[0],
        )?.createdAt.getTime() ?? Number.MAX_SAFE_INTEGER

      return leftCreatedAt - rightCreatedAt
    })[0]

  if (!candidate) {
    return
  }

  const [ownerUserId, participantIds] = candidate
  const participantId = participantIds[0]
  if (!participantId) {
    return
  }

  const existingMembership = memberships.find(
    (membership) => membership.userId === ownerUserId,
  )

  if (existingMembership) {
    if (existingMembership.role === GroupRole.OWNER) {
      return
    }

    await tx.userGroupMembership.update({
      where: {
        userId_groupId: {
          userId: ownerUserId,
          groupId,
        },
      },
      data: {
        role: GroupRole.OWNER,
        ...(existingMembership.activeParticipantId === null
          ? { activeParticipantId: participantId }
          : {}),
      },
    })
    return
  }

  await tx.userGroupMembership.create({
    data: {
      id: randomId(),
      userId: ownerUserId,
      groupId,
      role: GroupRole.OWNER,
      activeParticipantId: participantId,
      lastAccessedAt: new Date(),
    },
  })
}

export async function pruneOrphanedGroupMemberships(groupId: string) {
  return prisma.$transaction(async (tx) => {
    const orphanCandidates = await tx.userGroupMembership.findMany({
      where: {
        groupId,
        activeParticipantId: null,
        role: { not: GroupRole.OWNER },
      },
      select: {
        userId: true,
      },
    })

    if (orphanCandidates.length === 0) {
      return { removedCount: 0 }
    }

    const linkedParticipants = await tx.participant.findMany({
      where: {
        groupId,
        appUserId: {
          in: orphanCandidates.map((membership) => membership.userId),
        },
      },
      select: {
        appUserId: true,
      },
    })

    const usersWithLinkedParticipant = new Set(
      linkedParticipants
        .map((participant) => participant.appUserId)
        .filter((userId): userId is string => userId !== null),
    )

    const orphanUserIds = orphanCandidates
      .map((membership) => membership.userId)
      .filter((userId) => !usersWithLinkedParticipant.has(userId))

    if (orphanUserIds.length === 0) {
      return { removedCount: 0 }
    }

    const { count } = await tx.userGroupMembership.deleteMany({
      where: {
        groupId,
        activeParticipantId: null,
        role: { not: GroupRole.OWNER },
        userId: { in: orphanUserIds },
      },
    })

    return { removedCount: count }
  })
}

export async function getGroupMembershipUsers(groupId: string) {
  const memberships = await prisma.userGroupMembership.findMany({
    where: { groupId },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          email: true,
          displayName: true,
        },
      },
      activeParticipant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return memberships.filter((membership) => membership.activeParticipant !== null)
}

export async function removeUserGroupMembership(userId: string, groupId: string) {
  await prisma.userGroupMembership.deleteMany({
    where: {
      userId,
      groupId,
    },
  })
}

export async function removeUserFromGroup(groupId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.userGroupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
      select: {
        role: true,
      },
    })
    if (!membership) {
      throw new Error('The user is not a member of this group.')
    }
    if (membership.role === GroupRole.OWNER) {
      throw new Error('The group owner cannot be removed.')
    }

    await tx.participant.updateMany({
      where: {
        groupId,
        appUserId: userId,
      },
      data: {
        appUserId: null,
      },
    })

    await tx.userGroupMembership.delete({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    })

    return { success: true }
  })
}

export async function addUserToGroupByEmail(
  groupId: string,
  participantId: string,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error('Email is required.')
  }

  return prisma.$transaction(async (tx) => {
    const participant = await tx.participant.findFirst({
      where: {
        id: participantId,
        groupId,
      },
      select: {
        id: true,
        name: true,
        appUserId: true,
      },
    })
    if (!participant) {
      throw new Error(`Invalid participant ID: ${participantId}`)
    }

    const user = await tx.appUser.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    })
    if (!user) {
      throw new Error('The invited user must sign in before you can add them.')
    }

    if (participant.appUserId && participant.appUserId !== user.id) {
      throw new Error('This participant is already linked to another account.')
    }

    const existingLinkedParticipant = await tx.participant.findFirst({
      where: {
        groupId,
        appUserId: user.id,
        id: { not: participantId },
      },
      select: { id: true },
    })
    if (existingLinkedParticipant) {
      throw new Error('This user is already linked to another participant in the group.')
    }

    await tx.participant.update({
      where: { id: participantId },
      data: {
        appUserId: user.id,
      },
    })

    await tx.userGroupMembership.upsert({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
      create: {
        id: randomId(),
        userId: user.id,
        groupId,
        role: GroupRole.MEMBER,
        activeParticipantId: participantId,
        lastAccessedAt: new Date(),
      },
      update: {
        activeParticipantId: participantId,
        lastAccessedAt: new Date(),
      },
    })

    return {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      participantId: participant.id,
      participantName: participant.name,
    }
  })
}
