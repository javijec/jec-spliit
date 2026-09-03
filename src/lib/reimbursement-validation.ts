import { BalancesByCurrency, getSuggestedReimbursements } from '@/lib/balances'

export type ReimbursementPaymentInput = {
  amount: number
  currencyCode: string
  from: string
  to: string
}

export function validateReimbursementPayment(
  input: ReimbursementPaymentInput,
  participants: Array<{ id: string }>,
  groupCurrencyCode: string | null,
  balancesByCurrency: BalancesByCurrency,
) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error(
      'Reimbursement amount must be a positive minor-unit integer',
    )
  }

  const participantIds = new Set(participants.map(({ id }) => id))
  if (!participantIds.has(input.from) || !participantIds.has(input.to)) {
    throw new Error('Reimbursement participants must belong to the group')
  }
  if (input.from === input.to) {
    throw new Error('Reimbursement payer and payee must be different')
  }

  const currencyCode = input.currencyCode || groupCurrencyCode || ''
  const balances = balancesByCurrency[currencyCode]
  if (!balances)
    throw new Error('Reimbursement currency is not supported by this group')

  const suggestion = getSuggestedReimbursements(balances).find(
    ({ from, to }) => from === input.from && to === input.to,
  )
  if (!suggestion)
    throw new Error('No current debt exists between these participants')
  if (input.amount > suggestion.amount) {
    throw new Error('Reimbursement amount exceeds the remaining debt')
  }

  return { currencyCode, maxAmount: suggestion.amount }
}
