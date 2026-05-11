import { SplitMode } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'

import { createExpense, getGroupExpenses } from '@/lib/expenses'
import { getGroup } from '@/lib/groups'
import { MobileAuthError, requireMobileAppUser } from '@/lib/mobile-auth'
import {
  createMobileExpensePayload,
  createReimbursementPayload,
  mapMobileExpense,
} from '@/lib/mobile-responses'
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
  currencyCode?: string
  fromParticipantId: string
  toParticipantId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '20')
    const cursor = Number(request.nextUrl.searchParams.get('cursor') ?? '0')
    const filter = request.nextUrl.searchParams.get('filter') ?? undefined

    await requireGroupMembership(user.id, groupId)

    const expenses = await getGroupExpenses(groupId, {
      length: limit,
      offset: cursor,
      filter,
    })

    return NextResponse.json({
      expenses: expenses.map(mapMobileExpense),
      nextCursor: cursor + limit,
      hasMore: expenses.length === limit,
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to load expenses.' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params

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
          currencyCode: body.currencyCode ?? group.currencyCode,
        })
      : createMobileExpensePayloadFromBody(body, group.currencyCode)

    const expense = await createExpense(payload, groupId)

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
      { error: 'Failed to create expense.' },
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
