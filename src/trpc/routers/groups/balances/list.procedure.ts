import { getGroup } from '@/lib/groups'
import {
  getGroupBalanceExpenses,
  syncRecurringExpensesForGroupIfDue,
} from '@/lib/expenses'
import {
  ReimbursementByCurrency,
  getBalancesByCurrency,
  getPublicBalances,
  getSuggestedReimbursements,
} from '@/lib/balances'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupMembership } from '../authorization'
import { z } from 'zod'

export const listGroupBalancesProcedure = protectedProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ ctx, input: { groupId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)
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
    ) satisfies ReimbursementByCurrency[]

    return {
      balancesByCurrency: publicBalancesByCurrency,
      reimbursements,
    }
  })
