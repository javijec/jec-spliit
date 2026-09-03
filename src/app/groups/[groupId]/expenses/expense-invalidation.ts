import { trpc } from '@/trpc/client'

export async function invalidateCreatedExpenseData(
  utils: ReturnType<typeof trpc.useUtils>,
  groupId: string,
) {
  await Promise.all([
    utils.groups.expenses.list.invalidate({ groupId }),
    utils.groups.reimbursements.list.invalidate({ groupId }),
    utils.groups.balances.list.invalidate({ groupId }),
    utils.groups.stats.get.invalidate({ groupId }),
    utils.groups.activities.list.invalidate({ groupId }),
    utils.groups.mine.invalidate(),
  ])
}
