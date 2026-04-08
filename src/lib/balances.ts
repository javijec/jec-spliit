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

    const dividedAmount = isLast ? remaining : (amount * shares) / totalShares
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

export function getBalances(
  expenses: BalanceExpense[],
): Balances {
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

/**
 * A comparator that is stable across reimbursements.
 * This ensures that a participant executing a suggested reimbursement
 * does not result in completely new repayment suggestions.
 */
function compareBalancesForReimbursements(b1: any, b2: any): number {
  // positive balances come before negative balances
  if (b1.total > 0 && 0 > b2.total) {
    return -1
  } else if (b2.total > 0 && 0 > b1.total) {
    return 1
  }
  // if signs match, sort based on userid
  return b1.participantId < b2.participantId ? -1 : 1
}

export function getSuggestedReimbursements(
  balances: Balances,
): Reimbursement[] {
  const balancesArray = Object.entries(balances)
    .map(([participantId, { total }]) => ({ participantId, total }))
    .filter((b) => b.total !== 0)
  balancesArray.sort(compareBalancesForReimbursements)
  const reimbursements: Reimbursement[] = []
  while (balancesArray.length > 1) {
    const first = balancesArray[0]
    const last = balancesArray[balancesArray.length - 1]
    const amount = first.total + last.total
    if (first.total > -last.total) {
      reimbursements.push({
        from: last.participantId,
        to: first.participantId,
        amount: -last.total,
      })
      first.total = amount
      balancesArray.pop()
    } else {
      reimbursements.push({
        from: last.participantId,
        to: first.participantId,
        amount: first.total,
      })
      last.total = amount
      balancesArray.shift()
    }
  }
  return reimbursements.filter(({ amount }) => Math.round(amount) + 0 !== 0)
}
