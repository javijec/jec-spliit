import {
  getBalancesByCurrency,
  getSuggestedReimbursements,
} from '@/lib/balances'
import { validateReimbursementPayment } from './reimbursement-validation'

const participants = [{ id: 'alice' }, { id: 'bob' }]
const balances = {
  USD: {
    alice: { paid: 1000, paidFor: 0, total: 1000 },
    bob: { paid: 0, paidFor: 1000, total: -1000 },
  },
}

describe('validateReimbursementPayment', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5])(
    'rejects invalid amount %s',
    (amount) => {
      expect(() =>
        validateReimbursementPayment(
          { amount, currencyCode: 'USD', from: 'bob', to: 'alice' },
          participants,
          'USD',
          balances,
        ),
      ).toThrow()
    },
  )

  it('accepts full and partial payments but rejects overpayment', () => {
    expect(
      validateReimbursementPayment(
        { amount: 1000, currencyCode: 'USD', from: 'bob', to: 'alice' },
        participants,
        'USD',
        balances,
      ).maxAmount,
    ).toBe(1000)
    expect(
      validateReimbursementPayment(
        { amount: 250, currencyCode: 'USD', from: 'bob', to: 'alice' },
        participants,
        'USD',
        balances,
      ).maxAmount,
    ).toBe(1000)
    expect(() =>
      validateReimbursementPayment(
        { amount: 1001, currencyCode: 'USD', from: 'bob', to: 'alice' },
        participants,
        'USD',
        balances,
      ),
    ).toThrow('exceeds')
  })

  it.each([
    { from: 'outsider', to: 'alice', currencyCode: 'USD' },
    { from: 'bob', to: 'bob', currencyCode: 'USD' },
    { from: 'bob', to: 'alice', currencyCode: 'EUR' },
  ])('rejects unsafe payment parameters', (input) => {
    expect(() =>
      validateReimbursementPayment(
        { ...input, amount: 100 },
        participants,
        'USD',
        balances,
      ),
    ).toThrow()
  })
})

describe('reimbursement recalculation', () => {
  it('reduces a partial debt and removes it after the full payment', () => {
    const baseExpense = {
      amount: 1000,
      originalAmount: null,
      originalCurrency: null,
      expenseDate: new Date(),
      isReimbursement: false,
      paidBy: { id: 'alice' },
      paidFor: [{ participant: { id: 'bob' }, shares: 1 }],
      splitMode: 'EVENLY',
    }
    const expenses = [baseExpense] as any[]
    const before = getBalancesByCurrency(expenses, 'USD')
    expect(getSuggestedReimbursements(before.USD)).toEqual([
      { from: 'bob', to: 'alice', amount: 1000 },
    ])

    const partial = [
      ...expenses,
      {
        ...expenses[0],
        amount: 250,
        originalAmount: null,
        paidBy: { id: 'bob' },
        paidFor: [{ participant: { id: 'alice' }, shares: 1 }],
        isReimbursement: true,
      },
    ] as any[]
    const afterPartial = getBalancesByCurrency(partial, 'USD')
    expect(getSuggestedReimbursements(afterPartial.USD)).toEqual([
      { from: 'bob', to: 'alice', amount: 750 },
    ])

    const full = [
      ...expenses,
      {
        ...expenses[0],
        paidBy: { id: 'bob' },
        paidFor: [{ participant: { id: 'alice' }, shares: 1 }],
        isReimbursement: true,
      },
    ] as any[]
    expect(
      getSuggestedReimbursements(getBalancesByCurrency(full, 'USD').USD),
    ).toEqual([])
  })
})
