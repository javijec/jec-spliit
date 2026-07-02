import { SplitMode } from '@prisma/client'
import { JWT } from 'google-auth-library'

import { env } from '@/lib/env'
import { randomId } from '@/lib/ids'
import { prisma } from '@/lib/prisma'

type PushExpense = Awaited<ReturnType<typeof getExpenseForPush>>

const fcmScope = 'https://www.googleapis.com/auth/firebase.messaging'

export async function registerMobilePushToken(input: {
  userId: string
  token: string
  platform: string
}) {
  const token = input.token.trim()
  if (!token) throw new Error('Push token is required.')

  await prisma.mobilePushToken.upsert({
    where: { token },
    create: {
      id: randomId(),
      userId: input.userId,
      token,
      platform: input.platform,
    },
    update: {
      userId: input.userId,
      platform: input.platform,
    },
  })
}

export async function deleteMobilePushToken(token: string) {
  await prisma.mobilePushToken.deleteMany({
    where: { token },
  })
}

export async function notifyGroupExpenseCreated(input: {
  groupId: string
  expenseId: string
  actorUserId: string
}) {
  const expense = await getExpenseForPush(input.expenseId)
  if (!expense) return

  const recipientTokens = await getRecipientTokens({
    groupId: input.groupId,
    actorUserId: input.actorUserId,
  })
  if (recipientTokens.length === 0) return

  await Promise.all(
    recipientTokens.map((recipient) =>
      sendFcmMessage({
        token: recipient.token,
        title: expense.isReimbursement
          ? 'Liquidación registrada'
          : 'Nuevo gasto agregado',
        body: buildPushBody(expense, recipient.userId),
        data: {
          groupId: input.groupId,
          expenseId: input.expenseId,
          type: expense.isReimbursement ? 'reimbursement' : 'expense',
        },
      }),
    ),
  )
}

async function getRecipientTokens(input: {
  groupId: string
  actorUserId: string
}) {
  return prisma.mobilePushToken.findMany({
    where: {
      userId: { not: input.actorUserId },
      user: {
        memberships: {
          some: {
            groupId: input.groupId,
            isArchived: false,
          },
        },
      },
    },
    select: {
      token: true,
      userId: true,
    },
  })
}

async function getExpenseForPush(expenseId: string) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      title: true,
      amount: true,
      originalAmount: true,
      originalCurrency: true,
      isReimbursement: true,
      splitMode: true,
      group: {
        select: {
          name: true,
          currencyCode: true,
        },
      },
      paidBy: {
        select: {
          name: true,
          appUserId: true,
        },
      },
      paidFor: {
        select: {
          shares: true,
          participant: {
            select: {
              appUserId: true,
            },
          },
        },
      },
    },
  })
}

function buildPushBody(expense: NonNullable<PushExpense>, recipientUserId: string) {
  if (expense.isReimbursement) {
    return `${expense.paidBy.name} registró una liquidación en ${expense.group.name}.`
  }

  const currency = expense.originalCurrency ?? expense.group.currencyCode ?? ''
  const amount = expense.originalAmount ?? expense.amount
  const recipientShare = calculateRecipientShare(expense, recipientUserId)
  const paidByRecipient = expense.paidBy.appUserId === recipientUserId

  if (paidByRecipient) {
    const othersShare = Math.max(amount - recipientShare, 0)
    if (othersShare > 0) {
      return `Te deben ${formatMinorAmount(currency, othersShare)} por ${expense.title}.`
    }
  }

  if (recipientShare > 0) {
    return `Debés ${formatMinorAmount(currency, recipientShare)} por ${expense.title}.`
  }

  return `${expense.paidBy.name} agregó ${expense.title} en ${expense.group.name}.`
}

function calculateRecipientShare(
  expense: NonNullable<PushExpense>,
  recipientUserId: string,
) {
  const paidFor = expense.paidFor
  const recipientShares = paidFor
    .filter((item) => item.participant.appUserId === recipientUserId)
    .reduce((sum, item) => sum + item.shares, 0)

  if (recipientShares <= 0) return 0

  const amount = expense.originalAmount ?? expense.amount
  if (expense.splitMode === SplitMode.BY_AMOUNT) return recipientShares
  if (expense.splitMode === SplitMode.BY_PERCENTAGE) {
    return Math.round((amount * recipientShares) / 10000)
  }

  const totalShares = paidFor.reduce((sum, item) => sum + item.shares, 0)
  if (totalShares <= 0) return 0
  return Math.round((amount * recipientShares) / totalShares)
}

function formatMinorAmount(currency: string, amount: number) {
  const value = (amount / 100).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency} ${value}`.trim()
}

async function sendFcmMessage(input: {
  token: string
  title: string
  body: string
  data: Record<string, string>
}) {
  await runCatching(async () => {
    const accessToken = await getFirebaseAccessToken()
    if (!accessToken || !env.FIREBASE_PROJECT_ID) return

    await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: input.token,
            notification: {
              title: input.title,
              body: input.body,
            },
            data: input.data,
          },
        }),
      },
    )
  })
}

async function getFirebaseAccessToken() {
  if (
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_CLIENT_EMAIL ||
    !env.FIREBASE_PRIVATE_KEY
  ) {
    return null
  }

  const client = new JWT({
    email: env.FIREBASE_CLIENT_EMAIL,
    key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [fcmScope],
  })

  const token = await client.authorize()
  return token.access_token ?? null
}

async function runCatching(action: () => Promise<void>) {
  try {
    await action()
  } catch {
    return undefined
  }
}
