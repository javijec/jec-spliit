import { StatsExpense } from '@/lib/expenses'

export function getTotalGroupSpending(
  expenses: StatsExpense[],
): number {
  return expenses.reduce(
    (total, expense) =>
      expense.isReimbursement ? total : total + expense.amount,
    0,
  )
}

export function getTotalActiveUserPaidFor(
  activeUserId: string | null,
  expenses: StatsExpense[],
): number {
  return expenses.reduce(
    (total, expense) =>
      expense.paidById === activeUserId && !expense.isReimbursement
        ? total + expense.amount
        : total,
    0,
  )
}

type Expense = StatsExpense

export function calculateShare(
  participantId: string | null,
  expense: Pick<
    Expense,
    'amount' | 'paidFor' | 'splitMode' | 'isReimbursement'
  >,
): number {
  if (expense.isReimbursement) return 0

  const paidFors = expense.paidFor
  const userPaidFor = paidFors.find(
    (paidFor) => paidFor.participantId === participantId,
  )

  if (!userPaidFor) return 0

  const shares = Number(userPaidFor.shares)

  switch (expense.splitMode) {
    case 'EVENLY':
      // Divide the total expense evenly among all participants
      return expense.amount / paidFors.length
    case 'BY_AMOUNT':
      // Directly add the user's share if the split mode is BY_AMOUNT
      return shares
    case 'BY_PERCENTAGE':
      // Calculate the user's share based on their percentage of the total expense
      return (expense.amount * shares) / 10000 // Assuming shares are out of 10000 for percentage
    case 'BY_SHARES':
      // Calculate the user's share based on their shares relative to the total shares
      const totalShares = paidFors.reduce(
        (sum, paidFor) => sum + Number(paidFor.shares),
        0,
      )
      return (expense.amount * shares) / totalShares
    default:
      return 0
  }
}

export function getTotalActiveUserShare(
  activeUserId: string | null,
  expenses: StatsExpense[],
): number {
  const total = expenses.reduce(
    (sum, expense) => sum + calculateShare(activeUserId, expense),
    0,
  )

  return parseFloat(total.toFixed(2))
}
