import { getBalancesByCurrency } from '@/lib/balances'
import type {
  BalanceExpense,
  StatsExpense,
  SummaryTotalExpense,
} from '@/lib/expenses'

export function getSummaryTotalsByCurrency(
  expenses: SummaryTotalExpense[],
  groupCurrencyCode: string | null,
) {
  const totalsByCurrency: Record<string, number> = {}

  for (const expense of expenses) {
    if (expense.isReimbursement || expense.amount <= 0) continue
    const currencyCode = expense.originalCurrency ?? groupCurrencyCode ?? 'USD'
    const amount = expense.originalAmount ?? expense.amount
    totalsByCurrency[currencyCode] =
      (totalsByCurrency[currencyCode] ?? 0) + amount
  }

  return totalsByCurrency
}

export function getSummaryPersonalBalanceByCurrency(
  expenses: StatsExpense[],
  groupCurrencyCode: string | null,
  participantId: string | undefined,
) {
  if (!participantId) return undefined

  const balanceExpenses = expenses.map((expense) => ({
    ...expense,
    paidBy: { id: expense.paidById },
    paidFor: expense.paidFor.map((paidFor) => ({
      participant: { id: paidFor.participantId },
      shares: paidFor.shares,
    })),
  })) as BalanceExpense[]

  return Object.fromEntries(
    Object.entries(
      getBalancesByCurrency(balanceExpenses, groupCurrencyCode),
    ).map(([currencyCode, balances]) => [
      currencyCode,
      balances[participantId]?.total ?? 0,
    ]),
  )
}

export function getSummaryLastActivityAt(expenses: SummaryTotalExpense[]) {
  return expenses.reduce<Date | null>(
    (latest, expense) =>
      !latest || expense.expenseDate > latest ? expense.expenseDate : latest,
    null,
  )
}
