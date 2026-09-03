import type { StatsExpense, SummaryTotalExpense } from '@/lib/expenses'
import {
  getSummaryLastActivityAt,
  getSummaryPersonalBalanceByCurrency,
  getSummaryTotalsByCurrency,
} from './summary'

function statsExpense(overrides: Partial<StatsExpense> = {}) {
  return {
    amount: 10000,
    expenseDate: new Date('2026-08-01T00:00:00.000Z'),
    isReimbursement: false,
    originalAmount: null,
    originalCurrency: null,
    paidById: 'alice',
    paidFor: [{ participantId: 'bob', shares: 1 }],
    splitMode: 'BY_AMOUNT',
    ...overrides,
  } as StatsExpense
}

function spendingExpense(overrides: Partial<SummaryTotalExpense> = {}) {
  return {
    amount: 10000,
    expenseDate: new Date('2026-08-01T00:00:00.000Z'),
    originalAmount: null,
    originalCurrency: null,
    ...overrides,
  } as SummaryTotalExpense
}

describe('summary aggregates', () => {
  it('returns a single-currency total without mixing units', () => {
    expect(
      getSummaryTotalsByCurrency(
        [spendingExpense(), spendingExpense({ amount: 2500 })],
        'USD',
      ),
    ).toEqual({ USD: 12500 })
  })

  it('keeps multiple currency totals separate', () => {
    expect(
      getSummaryTotalsByCurrency(
        [
          spendingExpense({ originalCurrency: 'ARS', originalAmount: 294640 }),
          spendingExpense({ originalCurrency: 'USD', originalAmount: 12000 }),
          spendingExpense({ isReimbursement: true, originalCurrency: 'ARS' }),
        ],
        'USD',
      ),
    ).toEqual({ ARS: 294640, USD: 12000 })
  })

  it('derives positive, negative, zero, and absent participant positions', () => {
    const expenses = [statsExpense()]
    expect(
      getSummaryPersonalBalanceByCurrency(expenses, 'USD', 'alice'),
    ).toEqual({ USD: 10000 })
    expect(getSummaryPersonalBalanceByCurrency(expenses, 'USD', 'bob')).toEqual(
      { USD: -10000 },
    )
    expect(
      getSummaryPersonalBalanceByCurrency(
        [statsExpense({ paidFor: [{ participantId: 'alice', shares: 1 }] })],
        'USD',
        'alice',
      ),
    ).toEqual({ USD: 0 })
    expect(
      getSummaryPersonalBalanceByCurrency(expenses, 'USD', undefined),
    ).toBeUndefined()
  })

  it('handles no expenses and returns the latest expense activity date', () => {
    expect(getSummaryTotalsByCurrency([], 'USD')).toEqual({})
    expect(getSummaryLastActivityAt([])).toBeNull()
    expect(
      getSummaryLastActivityAt([
        spendingExpense({ expenseDate: new Date('2026-08-03T00:00:00.000Z') }),
        spendingExpense({ expenseDate: new Date('2026-08-09T00:00:00.000Z') }),
      ]),
    ).toEqual(new Date('2026-08-09T00:00:00.000Z'))
  })
})
