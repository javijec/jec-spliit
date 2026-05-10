import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'

import { deleteExpense } from '@/lib/expenses'
import { MobileAuthError, requireMobileAppUser } from '@/lib/mobile-auth'
import { requireGroupMembership } from '@/trpc/routers/groups/authorization'

export const runtime = 'nodejs'

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
