import { getGroup } from '@/lib/groups'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { mapMobileBalances } from '@/lib/mobile-responses'
import {
  getGroupBalanceExpenses,
  syncRecurringExpensesForGroupIfDue,
} from '@/lib/expenses'
import {
  getBalancesByCurrency,
  getPublicBalances,
  getSuggestedReimbursements,
} from '@/lib/balances'
import { requireGroupMembership } from '@/trpc/routers/groups/authorization'
import { TRPCError } from '@trpc/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  try {
    const user = await requireMobileAppUser(request)
    const { groupId } = await params

    await requireGroupMembership(user.id, groupId)
    await syncRecurringExpensesForGroupIfDue(groupId)

    const [expenses, group] = await Promise.all([
      getGroupBalanceExpenses(groupId),
      getGroup(groupId),
    ])

    const balancesByCurrency = getBalancesByCurrency(
      expenses,
      group?.currencyCode ?? null,
    )
    const publicBalancesByCurrency = Object.fromEntries(
      Object.entries(balancesByCurrency).map(
        ([currencyCode, currencyBalances]) => [
          currencyCode,
          getPublicBalances(getSuggestedReimbursements(currencyBalances)),
        ],
      ),
    )
    const reimbursements = Object.entries(balancesByCurrency).flatMap(
      ([currencyCode, currencyBalances]) =>
        getSuggestedReimbursements(currencyBalances).map((reimbursement) => ({
          ...reimbursement,
          currencyCode,
        })),
    )

    return NextResponse.json(
      mapMobileBalances({
        balancesByCurrency: publicBalancesByCurrency,
        reimbursements,
      }),
    )
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof TRPCError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json(
      { error: 'Failed to load balances.' },
      { status: 500 },
    )
  }
}
