import { getGroup } from '@/lib/groups'
import { getGroupBalanceExpenses } from '@/lib/expenses'
import {
  ReimbursementByCurrency,
  getBalancesByCurrency,
  getPublicBalances,
  getSuggestedReimbursements,
} from '@/lib/balances'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const listGroupBalancesProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ input: { groupId } }) => {
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
