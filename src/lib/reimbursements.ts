import { getBalancesByCurrency } from '@/lib/balances'
import { createExpense, getGroupBalanceExpenses } from '@/lib/expenses'
import { getGroup } from '@/lib/groups'
import { prisma } from '@/lib/prisma'
import { ExpenseFormValues } from '@/lib/schemas'
import { RecurrenceRule } from '@prisma/client'
import {
  ReimbursementPaymentInput,
  validateReimbursementPayment,
} from './reimbursement-validation'

export { validateReimbursementPayment } from './reimbursement-validation'

export const REIMBURSEMENT_EXPENSE_TITLE = 'Reimbursement'

export async function createValidatedReimbursement(
  groupId: string,
  input: ReimbursementPaymentInput,
  participantId?: string,
) {
  const group = await getGroup(groupId)
  if (!group) throw new Error('Group not found')

  const balanceExpenses = await getGroupBalanceExpenses(groupId)
  const balancesByCurrency = getBalancesByCurrency(
    balanceExpenses,
    group.currencyCode,
  )
  const { currencyCode } = validateReimbursementPayment(
    input,
    group.participants,
    group.currencyCode,
    balancesByCurrency,
  )

  const expenseFormValues: ExpenseFormValues = {
    title: REIMBURSEMENT_EXPENSE_TITLE,
    expenseDate: new Date(),
    amount: input.amount,
    originalCurrency: currencyCode,
    originalAmount:
      currencyCode && currencyCode !== group.currencyCode
        ? input.amount
        : undefined,
    conversionRate: undefined,
    category: 1,
    paidBy: input.from,
    paidFor: [{ participant: input.to, shares: 1 }],
    isReimbursement: true,
    splitMode: 'EVENLY',
    saveDefaultSplittingOptions: false,
    documents: [],
    notes: '',
    recurrenceRule: RecurrenceRule.NONE,
  }

  return createExpense(expenseFormValues, groupId, participantId)
}

export type RegisteredReimbursement = {
  id: string
  amount: number
  originalAmount: number | null
  originalCurrency: string | null
  expenseDate: Date
  createdAt: Date
  paidBy: { id: string; name: string }
  paidFor: Array<{ participant: { id: string; name: string } }>
}

export async function getGroupReimbursements(
  groupId: string,
): Promise<RegisteredReimbursement[]> {
  const reimbursements = await prisma.expense.findMany({
    where: { groupId, isReimbursement: true },
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      amount: true,
      originalAmount: true,
      originalCurrency: true,
      expenseDate: true,
      createdAt: true,
      paidBy: { select: { id: true, name: true } },
      paidFor: {
        select: { participant: { select: { id: true, name: true } } },
      },
    },
  })
  return reimbursements
}
