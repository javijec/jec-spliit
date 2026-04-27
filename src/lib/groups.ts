import { randomId } from '@/lib/ids'
import { prisma } from '@/lib/prisma'
import { GroupFormValues } from '@/lib/schemas'
import { ActivityType, GroupRole, Prisma, RecurrenceRule } from '@prisma/client'

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

export type ImportedExpense = {
  expenseDate: Date
  title: string
  amount: number
  currencyCode: string
  paidByName: string
  paidFor: Array<{ participantName: string; shares: number }>
  isReimbursement: boolean
}

export async function createGroupFromImportedExpenses(
  groupFormValues: GroupFormValues,
  importedExpenses: ImportedExpense[],
  options?: {
    userId?: string
    activeParticipantName?: string
    linkedUserName?: string
  },
) {
  const group = await createGroup(groupFormValues, options)
  const participantIdByName = new Map(
    group.participants.map((participant) => [participant.name, participant.id]),
  )
  const expensesToCreate: Prisma.ExpenseCreateManyInput[] = []
  const expensePaidForToCreate: Prisma.ExpensePaidForCreateManyInput[] = []

  for (const importedExpense of importedExpenses) {
    const paidById = participantIdByName.get(importedExpense.paidByName)
    if (!paidById) {
      throw new Error(
        `Unknown participant in paidBy: ${importedExpense.paidByName}`,
      )
    }
    const expenseId = randomId()
    const useOriginalCurrency =
      group.currencyCode &&
      importedExpense.currencyCode &&
      importedExpense.currencyCode !== group.currencyCode

    expensesToCreate.push({
      id: expenseId,
      groupId: group.id,
      expenseDate: importedExpense.expenseDate,
      title: importedExpense.title,
      categoryId: importedExpense.isReimbursement ? 1 : 0,
      amount: importedExpense.amount,
      originalAmount: useOriginalCurrency ? importedExpense.amount : null,
      originalCurrency: useOriginalCurrency
        ? importedExpense.currencyCode
        : null,
      conversionRate: null,
      paidById,
      splitMode: 'BY_AMOUNT',
      recurrenceRule: RecurrenceRule.NONE,
      isReimbursement: importedExpense.isReimbursement,
      notes: null,
    })

    for (const paidFor of importedExpense.paidFor) {
      const participantId = participantIdByName.get(paidFor.participantName)
      if (!participantId) {
        throw new Error(
          `Unknown participant in paidFor: ${paidFor.participantName}`,
        )
      }
      expensePaidForToCreate.push({
        expenseId,
        participantId,
        shares: paidFor.shares,
      })
    }
  }

  await prisma.$transaction([
    prisma.expense.createMany({ data: expensesToCreate }),
    prisma.expensePaidFor.createMany({ data: expensePaidForToCreate }),
  ])

  return { groupId: group.id }
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

  return prisma.group.update({
    where: { id: groupId },
    data: {
      name: groupFormValues.name,
      information: groupFormValues.information,
      currency: groupFormValues.currency,
      currencyCode: groupFormValues.currencyCode,
      participants: {
        deleteMany: existingGroup.participants.filter(
          (participant) =>
            !groupFormValues.participants.some(
              (nextParticipant) => nextParticipant.id === participant.id,
            ),
        ),
        updateMany: groupFormValues.participants
          .filter((participant) => participant.id !== undefined)
          .map((participant) => ({
            where: { id: participant.id },
            data: { name: participant.name },
          })),
        createMany: {
          data: groupFormValues.participants
            .filter((participant) => participant.id === undefined)
            .map((participant) => ({
              id: randomId(),
              name: participant.name,
            })),
        },
      },
    },
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
