import { getBalancesByCurrency, getSuggestedReimbursements } from './balances'

describe('getSuggestedReimbursements', () => {
  it('settles two participants with one transfer', () => {
    expect(
      getSuggestedReimbursements({
        alice: { paid: 100, paidFor: 0, total: 100 },
        bob: { paid: 0, paidFor: 100, total: -100 },
      }),
    ).toEqual([{ from: 'bob', to: 'alice', amount: 100 }])
  })

  it('uses a deterministic greedy chain for three participants', () => {
    const balances = {
      alice: { paid: 150, paidFor: 50, total: 100 },
      bob: { paid: 0, paidFor: 60, total: -60 },
      carol: { paid: 0, paidFor: 40, total: -40 },
    }

    expect(getSuggestedReimbursements(balances)).toEqual([
      { from: 'bob', to: 'alice', amount: 60 },
      { from: 'carol', to: 'alice', amount: 40 },
    ])
    expect(getSuggestedReimbursements(balances)).toEqual(
      getSuggestedReimbursements({ ...balances }),
    )
  })

  it('handles multiple creditors and debtors without self-transfers', () => {
    const reimbursements = getSuggestedReimbursements({
      alice: { paid: 120, paidFor: 0, total: 120 },
      bob: { paid: 80, paidFor: 0, total: 80 },
      carol: { paid: 0, paidFor: 100, total: -100 },
      dave: { paid: 0, paidFor: 100, total: -100 },
    })

    expect(reimbursements).toEqual([
      { from: 'carol', to: 'alice', amount: 100 },
      { from: 'dave', to: 'alice', amount: 20 },
      { from: 'dave', to: 'bob', amount: 80 },
    ])
    expect(reimbursements.every(({ amount }) => amount > 0)).toBe(true)
    expect(reimbursements.every(({ from, to }) => from !== to)).toBe(true)
  })

  it('returns no transfers for a settled group', () => {
    expect(
      getSuggestedReimbursements({
        alice: { paid: 100, paidFor: 100, total: 0 },
        bob: { paid: 0, paidFor: 0, total: 0 },
      }),
    ).toEqual([])
  })

  it('keeps currency balances isolated and rounds split shares to minor units', () => {
    const expenses = [
      {
        amount: 100,
        originalAmount: null,
        originalCurrency: null,
        paidBy: { id: 'alice' },
        paidFor: [
          { participant: { id: 'alice' }, shares: 1 },
          { participant: { id: 'bob' }, shares: 1 },
          { participant: { id: 'carol' }, shares: 1 },
        ],
        splitMode: 'EVENLY',
      },
      {
        amount: 200,
        originalAmount: 200,
        originalCurrency: 'EUR',
        paidBy: { id: 'bob' },
        paidFor: [
          { participant: { id: 'alice' }, shares: 1 },
          { participant: { id: 'bob' }, shares: 1 },
        ],
        splitMode: 'EVENLY',
      },
    ] as const

    const balances = getBalancesByCurrency(expenses as never, 'USD')

    expect(balances.USD.alice).toEqual({ paid: 100, paidFor: 33, total: 67 })
    expect(balances.USD.bob).toEqual({ paid: 0, paidFor: 33, total: -33 })
    expect(balances.USD.carol).toEqual({ paid: 0, paidFor: 34, total: -34 })
    expect(balances.EUR.alice.total).toBe(-100)
    expect(balances.EUR.bob.total).toBe(100)
  })
})
