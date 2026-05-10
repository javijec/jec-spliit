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
      | {
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
      | {
          reimbursement: true
          amount: number
          fromParticipantId: string
          toParticipantId: string
        }

    const payload =
      'reimbursement' in body && body.reimbursement
        ? createReimbursementPayload({
            amount: body.amount,
            fromParticipantId: body.fromParticipantId,
            toParticipantId: body.toParticipantId,
            currencyCode: group.currencyCode,
          })
        : (() => {
            const expenseBody = body
            return createMobileExpensePayload({
              title: expenseBody.title,
              amount: expenseBody.amount,
              paidBy: expenseBody.paidBy,
              paidFor:
                expenseBody.paidFor ??
                expenseBody.splitBetween?.map((participantId: string) => ({
                  participantId,
                  shares: 1,
                })) ??
                [],
              currencyCode: expenseBody.currencyCode ?? group.currencyCode,
              expenseDate: expenseBody.expenseDate
                ? new Date(expenseBody.expenseDate)
                : undefined,
              splitMode:
                expenseBody.splitMode && expenseBody.splitMode in SplitMode
                  ? SplitMode[expenseBody.splitMode]
                  : SplitMode.EVENLY,
            })
          })()

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
