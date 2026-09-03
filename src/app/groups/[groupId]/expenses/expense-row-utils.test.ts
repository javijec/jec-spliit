import { getPersonalExpenseShare } from './expense-row-utils'

function makeExpense(
  splitMode: 'EVENLY' | 'BY_SHARES' | 'BY_PERCENTAGE' | 'BY_AMOUNT',
  amount = 12_000,
) {
  return {
    amount,
    isReimbursement: false,
    splitMode,
    paidFor: [
      { participant: { id: 'alice' }, shares: 1_000 },
      { participant: { id: 'bob' }, shares: 1_000 },
    ],
  } as const
}

describe('getPersonalExpenseShare', () => {
  it('calculates an even share for an included participant', () => {
    expect(getPersonalExpenseShare('alice', makeExpense('EVENLY'))).toBe(6_000)
  })

  it('reuses the stored share rules for shares, percentages, and amounts', () => {
    expect(getPersonalExpenseShare('alice', makeExpense('BY_SHARES'))).toBe(
      6_000,
    )
    expect(
      getPersonalExpenseShare('alice', {
        ...makeExpense('BY_PERCENTAGE'),
        paidFor: [
          { participant: { id: 'alice' }, shares: 2_500 },
          { participant: { id: 'bob' }, shares: 7_500 },
        ],
      }),
    ).toBe(3_000)
    expect(
      getPersonalExpenseShare('alice', {
        ...makeExpense('BY_AMOUNT'),
        paidFor: [
          { participant: { id: 'alice' }, shares: 2_500 },
          { participant: { id: 'bob' }, shares: 9_500 },
        ],
      }),
    ).toBe(2_500)
  })

  it('distinguishes excluded and missing active participants', () => {
    expect(getPersonalExpenseShare('carol', makeExpense('EVENLY'))).toBeNull()
    expect(getPersonalExpenseShare(null, makeExpense('EVENLY'))).toBeUndefined()
  })

  it('does not present a personal share for reimbursements', () => {
    expect(
      getPersonalExpenseShare('alice', {
        ...makeExpense('EVENLY'),
        isReimbursement: true,
      }),
    ).toBeNull()
  })
})
