import { TRPCError } from '@trpc/server'
import { SplitMode } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { deleteExpense, updateExpense } from '@/lib/expenses'
import { MobileAuthError, requireMobileAppUser } from '@/lib/mobile-auth'
import {
  createMobileExpensePayload,
  createReimbursementPayload,
} from '@/lib/mobile-responses'
import { getGroup } from '@/lib/groups'
import { requireGroupMembership } from '@/trpc/routers/groups/authorization'

export const runtime = 'nodejs'

type MobileExpenseRequestBody = {
  title: string
  amount: number
  currencyCode?: string
  expenseDate?: string
  splitMode?: keyof typeof SplitMode
  paidBy: string
  paidFor?: Array<{
    participantId: string
    shares: number
  }>
  splitBetween?: string[]
}

type MobileReimbursementRequestBody = {
  reimbursement: true
  amount: number
  fromParticipantId: string
  toParticipantId: string
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId, expenseId } = await params

    await requireGroupMembership(user.id, groupId)
    await deleteExpense(groupId, expenseId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to delete expense.' },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ groupId: string; expenseId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId, expenseId } = await params

    await requireGroupMembership(user.id, groupId)

    const group = await getGroup(groupId)
    if (!group) {
      return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
    }

    const body = (await request.json()) as
      | MobileExpenseRequestBody
      | MobileReimbursementRequestBody

    const payload = ifReimbursement(body)
      ? createReimbursementPayload({
          amount: body.amount,
          fromParticipantId: body.fromParticipantId,
          toParticipantId: body.toParticipantId,
          currencyCode: group.currencyCode,
        })
      : createMobileExpensePayloadFromBody(body, group.currencyCode)

    const expense = await updateExpense(groupId, expenseId, payload)

    return NextResponse.json({
      expenseId: expense.id,
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update expense.' },
      { status: 500 },
    )
  }
}

function ifReimbursement(
  body: MobileExpenseRequestBody | MobileReimbursementRequestBody,
): body is MobileReimbursementRequestBody {
  return 'reimbursement' in body && body.reimbursement === true
}

function createMobileExpensePayloadFromBody(
  body: MobileExpenseRequestBody,
  groupCurrencyCode: string | null,
) {
  return createMobileExpensePayload({
    title: body.title,
    amount: body.amount,
    paidBy: body.paidBy,
    paidFor:
      body.paidFor ??
      body.splitBetween?.map((participantId) => ({
        participantId,
        shares: 1,
      })) ??
      [],
    currencyCode: body.currencyCode ?? groupCurrencyCode,
    expenseDate: body.expenseDate ? new Date(body.expenseDate) : undefined,
    splitMode:
      body.splitMode && body.splitMode in SplitMode
        ? SplitMode[body.splitMode]
        : SplitMode.EVENLY,
  })
}
