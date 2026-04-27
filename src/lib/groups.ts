import { randomId } from '@/lib/ids'
import { prisma } from '@/lib/prisma'
import { GroupFormValues } from '@/lib/schemas'
import { ActivityType, GroupRole } from '@prisma/client'

export async function createGroup(
  groupFormValues: GroupFormValues,
  options?: {
    userId?: string
    activeParticipantName?: string
    linkedUserName?: string
  },
) {
  const groupId = randomId()
  const participantIdsByName = new Map<string, string>(
    groupFormValues.participants.map((participant) => [
      participant.name,
      randomId(),
    ]),
  )
  const activeParticipantId = options?.activeParticipantName
    ? participantIdsByName.get(options.activeParticipantName) ?? null
    : null
  const participantNames = new Set(groupFormValues.participants.map((participant) => participant.name))
  const linkedParticipantName =
    options?.userId &&
    options.linkedUserName &&
    options.activeParticipantName
      ? (() => {
          const originalName = options.activeParticipantName
          participantNames.delete(originalName)
          let suffix = 1
          let candidate = options.linkedUserName
          while (participantNames.has(candidate)) {
            suffix += 1
            candidate = `${options.linkedUserName} (${suffix})`
          }
          return candidate
        })()
      : null

  return prisma.$transaction(async (tx) => {
    await tx.group.create({
      data: {
        id: groupId,
        name: groupFormValues.name,
        information: groupFormValues.information,
        currency: groupFormValues.currency,
        currencyCode: groupFormValues.currencyCode,
        participants: {
          createMany: {
            data: groupFormValues.participants.map(({ name }) => ({
              id: participantIdsByName.get(name) ?? randomId(),
              name:
                options?.userId &&
                options.activeParticipantName === name &&
                linkedParticipantName
                  ? linkedParticipantName
                  : name,
              appUserId:
                options?.userId && options.activeParticipantName === name
                  ? options.userId
                  : undefined,
            })),
          },
        },
      },
    })

    if (options?.userId) {
      await tx.userGroupMembership.create({
        data: {
          id: randomId(),
          userId: options.userId,
          groupId,
          role: GroupRole.OWNER,
          activeParticipantId,
          lastAccessedAt: new Date(),
        },
      })
    }

    const createdGroup = await tx.group.findUnique({
      where: { id: groupId },
      include: { participants: true },
    })

    if (!createdGroup) {
      throw new Error('Failed to create group')
    }

    return createdGroup
  })
}

export async function getGroups(groupIds: string[]) {
  return (
    await prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: {
        id: true,
        name: true,
        currency: true,
        createdAt: true,
        information: true,
        currencyCode: true,
        _count: { select: { participants: true } },
      },
    })
  ).map((group) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }))
}

export async function getGroupsForUser(userId: string, groupIds: string[]) {
  return (
    await prisma.userGroupMembership.findMany({
      where: {
        userId,
        groupId: { in: groupIds },
      },
      select: {
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
  ).map(({ group }) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }))
}

export async function updateGroup(
  groupId: string,
  groupFormValues: GroupFormValues,
  participantId?: string,
) {
  const existingGroup = await getGroup(groupId)
  if (!existingGroup) throw new Error('Invalid group ID')

  await logActivity(groupId, ActivityType.UPDATE_GROUP, { participantId })

  const removedParticipantIds = existingGroup.participants
    .filter(
      (participant) =>
        !groupFormValues.participants.some(
          (nextParticipant) => nextParticipant.id === participant.id,
        ),
    )
    .map((participant) => participant.id)

  const participantsToUpdate = groupFormValues.participants.filter(
    (participant): participant is { id: string; name: string } =>
      participant.id !== undefined,
  )

  const participantsToCreate = groupFormValues.participants.filter(
    (participant) => participant.id === undefined,
  )

  return prisma.$transaction(async (tx) => {
    await tx.group.update({
      where: { id: groupId },
      data: {
        name: groupFormValues.name,
        information: groupFormValues.information,
        currency: groupFormValues.currency,
        currencyCode: groupFormValues.currencyCode,
      },
    })

    if (removedParticipantIds.length > 0) {
      await tx.participant.deleteMany({
        where: {
          groupId,
          id: { in: removedParticipantIds },
        },
      })
    }

    await Promise.all(
      participantsToUpdate.map((participant) =>
        tx.participant.update({
          where: { id: participant.id },
          data: { name: participant.name },
        }),
      ),
    )

    if (participantsToCreate.length > 0) {
      await tx.participant.createMany({
        data: participantsToCreate.map((participant) => ({
          id: randomId(),
          name: participant.name,
          groupId,
        })),
      })
    }

    const updatedGroup = await tx.group.findUnique({
      where: { id: groupId },
      include: { participants: true },
    })

    if (!updatedGroup) {
      throw new Error('Failed to update group')
    }

    return updatedGroup
  })
}

export async function deleteGroup(groupId: string, participantId?: string) {
  const existingGroup = await getGroup(groupId)
  if (!existingGroup) throw new Error('Invalid group ID')

  await logActivity(groupId, ActivityType.UPDATE_GROUP, { participantId })
  await prisma.group.delete({
    where: { id: groupId },
  })
}

export async function getGroup(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      currency: true,
      createdAt: true,
      information: true,
      currencyCode: true,
      participants: {
        select: {
          id: true,
          name: true,
          groupId: true,
          appUserId: true,
          appUser: {
            select: {
              email: true,
              displayName: true,
            },
          },
        },
      },
    },
  })
}

export async function getCategories() {
  return prisma.category.findMany()
}

export async function getActivities(
  groupId: string,
  options?: { offset?: number; length?: number },
) {
  const activities = await prisma.activity.findMany({
    where: { groupId },
    orderBy: [{ time: 'desc' }],
    skip: options?.offset,
    take: options?.length,
  })

  const expenseIds = activities.map((activity) => activity.expenseId).filter(Boolean)
  const expenses = await prisma.expense.findMany({
    where: {
      groupId,
      id: { in: expenseIds },
    },
    select: {
      id: true,
      title: true,
      amount: true,
      originalAmount: true,
      originalCurrency: true,
      expenseDate: true,
      isReimbursement: true,
      createdAt: true,
      paidById: true,
      splitMode: true,
      categoryId: true,
      notes: true,
      recurrenceRule: true,
    },
  })
  const expensesById = new Map(expenses.map((expense) => [expense.id, expense]))

  return activities.map((activity) => ({
    ...activity,
    expense:
      activity.expenseId !== null
        ? expensesById.get(activity.expenseId)
        : undefined,
  }))
}

export async function logActivity(
  groupId: string,
  activityType: ActivityType,
  extra?: { participantId?: string; expenseId?: string; data?: string },
) {
  return prisma.activity.create({
    data: {
      id: randomId(),
      groupId,
      activityType,
      ...extra,
    },
  })
}
