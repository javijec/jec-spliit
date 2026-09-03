import { BalanceExpense } from '@/lib/expenses'
import { Participant } from '@prisma/client'
import { match } from 'ts-pattern'

export type Balances = Record<
  Participant['id'],
  { paid: number; paidFor: number; total: number }
>

export type Reimbursement = {
  from: Participant['id']
  to: Participant['id']
  amount: number
}

export type ReimbursementByCurrency = Reimbursement & {
  currencyCode: string
}

export type BalancesByCurrency = Record<string, Balances>

function getOrCreateBalance(
  balances: Balances,
  participantId: Participant['id'],
) {
  if (!balances[participantId]) {
    balances[participantId] = { paid: 0, paidFor: 0, total: 0 }
  }
  return balances[participantId]
}

function addExpenseToBalances(
  balances: Balances,
  expense: BalanceExpense,
  amount: number,
) {
  const paidBy = expense.paidBy.id
  const paidFors = expense.paidFor

  getOrCreateBalance(balances, paidBy).paid += amount

  const totalPaidForShares = paidFors.reduce(
    (sum, paidFor) => sum + paidFor.shares,
    0,
  )
  let remaining = amount
  paidFors.forEach((paidFor, index) => {
    const isLast = index === paidFors.length - 1

    const [shares, totalShares] = match(expense.splitMode)
      .with('EVENLY', () => [1, paidFors.length])
      .with('BY_SHARES', () => [paidFor.shares, totalPaidForShares])
      .with('BY_PERCENTAGE', () => [paidFor.shares, totalPaidForShares])
      .with('BY_AMOUNT', () => [paidFor.shares, totalPaidForShares])
      .exhaustive()

    const dividedAmount = isLast
      ? remaining
      : Math.round((amount * shares) / totalShares)
    remaining -= dividedAmount
    getOrCreateBalance(balances, paidFor.participant.id).paidFor +=
      dividedAmount
  })
}

function finalizeBalances(balances: Balances) {
  for (const participantId in balances) {
    balances[participantId].paidFor =
      Math.round(balances[participantId].paidFor) + 0
    balances[participantId].paid = Math.round(balances[participantId].paid) + 0
    balances[participantId].total =
      balances[participantId].paid - balances[participantId].paidFor
  }
}

export function getBalances(expenses: BalanceExpense[]): Balances {
  const balances: Balances = {}

  for (const expense of expenses) {
    addExpenseToBalances(balances, expense, expense.amount)
  }

  finalizeBalances(balances)
  return balances
}

export function getBalancesByCurrency(
  expenses: BalanceExpense[],
  groupCurrencyCode: string | null,
): BalancesByCurrency {
  const balancesByCurrency: BalancesByCurrency = {}

  for (const expense of expenses) {
    const currencyCode = expense.originalCurrency || groupCurrencyCode || ''
    const amount = expense.originalAmount ?? expense.amount
    if (!balancesByCurrency[currencyCode]) {
      balancesByCurrency[currencyCode] = {}
    }
    addExpenseToBalances(balancesByCurrency[currencyCode], expense, amount)
  }

  for (const currencyCode in balancesByCurrency) {
    finalizeBalances(balancesByCurrency[currencyCode])
  }

  return balancesByCurrency
}

export function getPublicBalances(reimbursements: Reimbursement[]): Balances {
  const balances: Balances = {}
  reimbursements.forEach((reimbursement) => {
    if (!balances[reimbursement.from])
      balances[reimbursement.from] = { paid: 0, paidFor: 0, total: 0 }

    if (!balances[reimbursement.to])
      balances[reimbursement.to] = { paid: 0, paidFor: 0, total: 0 }

    balances[reimbursement.from].paidFor += reimbursement.amount
    balances[reimbursement.from].total -= reimbursement.amount

    balances[reimbursement.to].paid += reimbursement.amount
    balances[reimbursement.to].total += reimbursement.amount
  })
  return balances
}

type BalanceParty = {
  participantId: Participant['id']
  amount: number
}

function compareParties(a: BalanceParty, b: BalanceParty): number {
  return b.amount - a.amount || a.participantId.localeCompare(b.participantId)
}

export function getSuggestedReimbursements(
  balances: Balances,
): Reimbursement[] {
  const creditors: BalanceParty[] = []
  const debtors: BalanceParty[] = []

  for (const [participantId, { total }] of Object.entries(balances)) {
    if (total > 0) creditors.push({ participantId, amount: total })
    if (total < 0) debtors.push({ participantId, amount: -total })
  }

  creditors.sort(compareParties)
  debtors.sort(compareParties)

  const reimbursements: Reimbursement[] = []

  let creditorIndex = 0
  let debtorIndex = 0
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    const amount = Math.min(creditor.amount, debtor.amount)

    if (amount > 0) {
      reimbursements.push({
        from: debtor.participantId,
        to: creditor.participantId,
        amount,
      })
    }

    creditor.amount -= amount
    debtor.amount -= amount

    if (creditor.amount === 0) creditorIndex += 1
    if (debtor.amount === 0) debtorIndex += 1
  }

  return reimbursements
}
