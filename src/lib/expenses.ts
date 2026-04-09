import { prisma } from '@/lib/prisma'
import { ExpenseFormValues } from '@/lib/schemas'
import { randomId } from '@/lib/ids'
import {
  ActivityType,
  Expense,
  Prisma,
  RecurrenceRule,
  RecurringExpenseLink,
} from '@prisma/client'

const balanceExpenseSelect = {
  amount: true,
  originalAmount: true,
  originalCurrency: true,
  paidBy: { select: { id: true } },
  paidFor: {
    select: {
      participant: { select: { id: true } },
      shares: true,
    },
  },
  splitMode: true,
} satisfies Prisma.ExpenseSelect

const statsExpenseSelect = {
  amount: true,
  originalAmount: true,
  originalCurrency: true,
  expenseDate: true,
  isReimbursement: true,
  paidById: true,
  paidFor: {
    select: {
      participantId: true,
      shares: true,
    },
  },
  splitMode: true,
} satisfies Prisma.ExpenseSelect

export type BalanceExpense = Prisma.ExpenseGetPayload<{
  select: typeof balanceExpenseSelect
}>

export type StatsExpense = Prisma.ExpenseGetPayload<{
  select: typeof statsExpenseSelect
}>

async function getGroupParticipants(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      participants: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!group) {
    throw new Error(`Invalid group ID: ${groupId}`)
  }

  return group.participants
}

async function logExpenseActivity(
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

export async function createExpense(
  expenseFormValues: ExpenseFormValues,
  groupId: string,
  participantId?: string,
): Promise<Expense> {
  const participants = await getGroupParticipants(groupId)

  for (const participant of [
    expenseFormValues.paidBy,
    ...expenseFormValues.paidFor.map((p) => p.participant),
  ]) {
    if (!participants.some((p) => p.id === participant)) {
      throw new Error(`Invalid participant ID: ${participant}`)
    }
  }

  const expenseId = randomId()
  await logExpenseActivity(groupId, ActivityType.CREATE_EXPENSE, {
    participantId,
    expenseId,
    data: expenseFormValues.title,
  })

  const isCreateRecurrence =
    expenseFormValues.recurrenceRule !== RecurrenceRule.NONE
  const recurringExpenseLinkPayload = createPayloadForNewRecurringExpenseLink(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    expenseFormValues.expenseDate,
    groupId,
  )

  return prisma.expense.create({
    data: {
      id: expenseId,
      groupId,
      expenseDate: expenseFormValues.expenseDate,
      categoryId: expenseFormValues.category,
      amount: expenseFormValues.amount,
      originalAmount: expenseFormValues.originalAmount,
      originalCurrency: expenseFormValues.originalCurrency,
      conversionRate: expenseFormValues.conversionRate,
      title: expenseFormValues.title,
      paidById: expenseFormValues.paidBy,
      splitMode: expenseFormValues.splitMode,
      recurrenceRule: expenseFormValues.recurrenceRule,
      recurringExpenseLink: {
        ...(isCreateRecurrence
          ? {
              create: recurringExpenseLinkPayload,
            }
          : {}),
      },
      paidFor: {
        createMany: {
          data: expenseFormValues.paidFor.map((paidFor) => ({
            participantId: paidFor.participant,
            shares: paidFor.shares,
          })),
        },
      },
      isReimbursement: expenseFormValues.isReimbursement,
      documents: {
        createMany: {
          data: expenseFormValues.documents.map((doc) => ({
            id: randomId(),
            url: doc.url,
            width: doc.width,
            height: doc.height,
          })),
        },
      },
      notes: expenseFormValues.notes,
    },
  })
}

export async function deleteExpense(
  groupId: string,
  expenseId: string,
  participantId?: string,
) {
  const existingExpense = await getExpense(groupId, expenseId)
  await logExpenseActivity(groupId, ActivityType.DELETE_EXPENSE, {
    participantId,
    expenseId,
    data: existingExpense?.title,
  })

  await prisma.expense.delete({
    where: { id: expenseId },
    include: { paidFor: true, paidBy: true },
  })
}

export async function getGroupExpensesParticipants(groupId: string) {
  const participants = await prisma.participant.findMany({
    where: {
      groupId,
      OR: [
        { expensesPaidBy: { some: { groupId } } },
        { expensesPaidFor: { some: { expense: { groupId } } } },
      ],
    },
    select: {
      id: true,
    },
  })

  return participants.map((participant) => participant.id)
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  expenseFormValues: ExpenseFormValues,
  participantId?: string,
) {
  const participants = await getGroupParticipants(groupId)
  const existingExpense = await getExpense(groupId, expenseId)
  if (!existingExpense) {
    throw new Error(`Invalid expense ID: ${expenseId}`)
  }

  for (const participant of [
    expenseFormValues.paidBy,
    ...expenseFormValues.paidFor.map((p) => p.participant),
  ]) {
    if (!participants.some((p) => p.id === participant)) {
      throw new Error(`Invalid participant ID: ${participant}`)
    }
  }

  await logExpenseActivity(groupId, ActivityType.UPDATE_EXPENSE, {
    participantId,
    expenseId,
    data: expenseFormValues.title,
  })

  const isDeleteRecurrenceExpenseLink =
    existingExpense.recurrenceRule !== RecurrenceRule.NONE &&
    expenseFormValues.recurrenceRule === RecurrenceRule.NONE &&
    existingExpense.recurringExpenseLink?.nextExpenseCreatedAt === null

  const isUpdateRecurrenceExpenseLink =
    existingExpense.recurrenceRule !== expenseFormValues.recurrenceRule &&
    existingExpense.recurringExpenseLink?.nextExpenseCreatedAt === null
  const isCreateRecurrenceExpenseLink =
    existingExpense.recurrenceRule === RecurrenceRule.NONE &&
    expenseFormValues.recurrenceRule !== RecurrenceRule.NONE &&
    existingExpense.recurringExpenseLink === null

  const newRecurringExpenseLink = createPayloadForNewRecurringExpenseLink(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    expenseFormValues.expenseDate,
    groupId,
  )

  const updatedRecurrenceExpenseLinkNextExpenseDate = calculateNextDate(
    expenseFormValues.recurrenceRule as RecurrenceRule,
    existingExpense.expenseDate,
  )

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      expenseDate: expenseFormValues.expenseDate,
      amount: expenseFormValues.amount,
      originalAmount: expenseFormValues.originalAmount,
      originalCurrency: expenseFormValues.originalCurrency,
      conversionRate: expenseFormValues.conversionRate,
      title: expenseFormValues.title,
      categoryId: expenseFormValues.category,
      paidById: expenseFormValues.paidBy,
      splitMode: expenseFormValues.splitMode,
      recurrenceRule: expenseFormValues.recurrenceRule,
      paidFor: {
        create: expenseFormValues.paidFor
          .filter(
            (paidFor) =>
              !existingExpense.paidFor.some(
                (existingPaidFor) =>
                  existingPaidFor.participantId === paidFor.participant,
              ),
          )
          .map((paidFor) => ({
            participantId: paidFor.participant,
            shares: paidFor.shares,
          })),
        update: expenseFormValues.paidFor.map((paidFor) => ({
          where: {
            expenseId_participantId: {
              expenseId,
              participantId: paidFor.participant,
            },
          },
          data: {
            shares: paidFor.shares,
          },
        })),
        deleteMany: existingExpense.paidFor.filter(
          (paidFor) =>
            !expenseFormValues.paidFor.some(
              (formPaidFor) => formPaidFor.participant === paidFor.participantId,
            ),
        ),
      },
      recurringExpenseLink: {
        ...(isCreateRecurrenceExpenseLink
          ? {
              create: newRecurringExpenseLink,
            }
          : {}),
        ...(isUpdateRecurrenceExpenseLink
          ? {
              update: {
                nextExpenseDate: updatedRecurrenceExpenseLinkNextExpenseDate,
              },
            }
          : {}),
        delete: isDeleteRecurrenceExpenseLink,
      },
      isReimbursement: expenseFormValues.isReimbursement,
      documents: {
        connectOrCreate: expenseFormValues.documents.map((doc) => ({
          create: doc,
          where: { id: doc.id },
        })),
        deleteMany: existingExpense.documents
          .filter(
            (existingDoc) =>
              !expenseFormValues.documents.some((doc) => doc.id === existingDoc.id),
          )
          .map((doc) => ({
            id: doc.id,
          })),
      },
      notes: expenseFormValues.notes,
    },
  })
}

export async function getGroupExpenses(
  groupId: string,
  options?: { offset?: number; length?: number; filter?: string },
) {
  return prisma.expense.findMany({
    select: {
      amount: true,
      category: true,
      conversionRate: true,
      createdAt: true,
      expenseDate: true,
      id: true,
      isReimbursement: true,
      originalAmount: true,
      originalCurrency: true,
      paidBy: { select: { id: true, name: true } },
      paidFor: {
        select: {
          participant: { select: { id: true, name: true } },
          shares: true,
        },
      },
      splitMode: true,
      recurrenceRule: true,
      title: true,
      _count: { select: { documents: true } },
    },
    where: {
      groupId,
      title: options?.filter
        ? { contains: options.filter, mode: 'insensitive' }
        : undefined,
    },
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    skip: options?.offset,
    take: options?.length,
  })
}

export async function getGroupBalanceExpenses(groupId: string) {
  return prisma.expense.findMany({
    select: balanceExpenseSelect,
    where: {
      groupId,
    },
  })
}

export async function getGroupStatsExpenses(
  groupId: string,
  options?: { participantId?: string; since?: Date },
) {
  return prisma.expense.findMany({
    select: statsExpenseSelect,
    where: {
      groupId,
      ...(options?.since ? { expenseDate: { gte: options.since } } : {}),
      ...(options?.participantId
        ? {
            OR: [
              { paidById: options.participantId },
              { paidFor: { some: { participantId: options.participantId } } },
            ],
          }
        : {}),
    },
  })
}

export async function getTotalGroupSpendingAmount(groupId: string) {
  const result = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      groupId,
      isReimbursement: false,
    },
  })

  return result._sum.amount ?? 0
}

export async function getGroupExpenseCount(groupId: string) {
  return prisma.expense.count({ where: { groupId } })
}

export async function getExpense(groupId: string, expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: true,
      paidFor: true,
      category: true,
      documents: true,
      recurringExpenseLink: true,
    },
  })
}

export async function syncRecurringExpensesForGroupIfDue(groupId: string) {
  const now = new Date()
  const syncThreshold = new Date(now.getTime() - 60 * 60 * 1000)
  let syncWindowClaim

  try {
    syncWindowClaim = await prisma.group.updateMany({
      where: {
        id: groupId,
        OR: [
          { recurringSyncAt: null },
          { recurringSyncAt: { lt: syncThreshold } },
        ],
      },
      data: {
        recurringSyncAt: now,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2022'
    ) {
      // The database schema is older than the codebase and does not have the
      // recurringSyncAt column yet. Fall back to a direct sync so local/dev
      // environments keep working until migrations are applied.
      return createRecurringExpenses({ groupId })
    }

    throw error
  }

  if (syncWindowClaim.count === 0) {
    return {
      skipped: true,
      processedLinks: 0,
      createdExpensesCount: 0,
    }
  }

  return createRecurringExpenses({ groupId })
}

export async function createRecurringExpenses(options?: { groupId?: string }) {
  const localDate = new Date()
  const utcDateFromLocal = new Date(
    Date.UTC(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
      localDate.getUTCHours(),
      localDate.getUTCMinutes(),
    ),
  )

  const recurringExpenseLinksWithExpensesToCreate =
    await prisma.recurringExpenseLink.findMany({
      where: {
        ...(options?.groupId ? { groupId: options.groupId } : {}),
        nextExpenseCreatedAt: null,
        nextExpenseDate: {
          lte: utcDateFromLocal,
        },
      },
      include: {
        currentFrameExpense: {
          include: {
            paidBy: true,
            paidFor: true,
            category: true,
            documents: true,
          },
        },
      },
    })

  let createdExpensesCount = 0

  for (const recurringExpenseLink of recurringExpenseLinksWithExpensesToCreate) {
    let newExpenseDate = recurringExpenseLink.nextExpenseDate
    let currentExpenseRecord = recurringExpenseLink.currentFrameExpense
    let currentRecurringExpenseLinkId = recurringExpenseLink.id

    while (newExpenseDate < utcDateFromLocal) {
      const newExpenseId = randomId()
      const newRecurringExpenseLinkId = randomId()

      const newRecurringExpenseNextExpenseDate = calculateNextDate(
        currentExpenseRecord.recurrenceRule as RecurrenceRule,
        newExpenseDate,
      )

      const {
        category,
        paidBy,
        paidFor,
        documents,
        ...destructuredCurrentExpenseRecord
      } = currentExpenseRecord

      const newExpense = await prisma
        .$transaction(async (transaction) => {
          const createdExpense = await transaction.expense.create({
            data: {
              ...destructuredCurrentExpenseRecord,
              categoryId: currentExpenseRecord.categoryId,
              paidById: currentExpenseRecord.paidById,
              paidFor: {
                createMany: {
                  data: currentExpenseRecord.paidFor.map((paidFor) => ({
                    participantId: paidFor.participantId,
                    shares: paidFor.shares,
                  })),
                },
              },
              documents: {
                connect: currentExpenseRecord.documents.map((documentRecord) => ({
                  id: documentRecord.id,
                })),
              },
              id: newExpenseId,
              expenseDate: newExpenseDate,
              recurringExpenseLink: {
                create: {
                  groupId: currentExpenseRecord.groupId,
                  id: newRecurringExpenseLinkId,
                  nextExpenseDate: newRecurringExpenseNextExpenseDate,
                },
              },
            },
            include: {
              paidFor: true,
              documents: true,
              category: true,
              paidBy: true,
            },
          })

          await transaction.recurringExpenseLink.update({
            where: {
              id: currentRecurringExpenseLinkId,
              nextExpenseCreatedAt: null,
            },
            data: {
              nextExpenseCreatedAt: createdExpense.createdAt,
            },
          })

          return createdExpense
        })
        .catch(() => {
          console.error(
            'Failed to created recurringExpense for expenseId: %s',
            currentExpenseRecord.id,
          )
          return null
        })

      if (newExpense === null) {
        break
      }

      createdExpensesCount += 1
      currentExpenseRecord = newExpense
      currentRecurringExpenseLinkId = newRecurringExpenseLinkId
      newExpenseDate = newRecurringExpenseNextExpenseDate
    }
  }

  return {
    skipped: false,
    processedLinks: recurringExpenseLinksWithExpensesToCreate.length,
    createdExpensesCount,
  }
}

function createPayloadForNewRecurringExpenseLink(
  recurrenceRule: RecurrenceRule,
  priorDateToNextRecurrence: Date,
  groupId: string,
): RecurringExpenseLink {
  const nextExpenseDate = calculateNextDate(
    recurrenceRule,
    priorDateToNextRecurrence,
  )

  return {
    id: randomId(),
    groupId,
    nextExpenseDate,
  } as RecurringExpenseLink
}

function calculateNextDate(
  recurrenceRule: RecurrenceRule,
  priorDateToNextRecurrence: Date,
): Date {
  const nextDate = new Date(priorDateToNextRecurrence)

  switch (recurrenceRule) {
    case RecurrenceRule.DAILY:
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      break
    case RecurrenceRule.WEEKLY:
      nextDate.setUTCDate(nextDate.getUTCDate() + 7)
      break
    case RecurrenceRule.MONTHLY: {
      const nextYear = nextDate.getUTCFullYear()
      const nextMonth = nextDate.getUTCMonth() + 1
      let nextDay = nextDate.getUTCDate()

      while (!isDateInNextMonth(nextYear, nextMonth, nextDay)) {
        nextDay -= 1
      }
      nextDate.setUTCMonth(nextMonth, nextDay)
      break
    }
  }

  return nextDate
}

function isDateInNextMonth(utcYear: number, utcMonth: number, utcDate: number) {
  const testDate = new Date(Date.UTC(utcYear, utcMonth, utcDate))
  return testDate.getUTCDate() === utcDate
}
