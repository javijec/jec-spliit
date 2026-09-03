jest.mock('@/lib/ids', () => ({
  randomId: () => 'test-id',
}))

import { mergeGroupFinancialSummaryRows } from './user-memberships'

describe('mergeGroupFinancialSummaryRows', () => {
  it('keeps positive, negative, zero, and multi-currency balances separate', () => {
    const lastActivityAt = new Date('2026-08-31T18:30:00.000Z')

    expect(
      mergeGroupFinancialSummaryRows([
        {
          groupId: 'trip',
          currencyCode: 'ARS',
          totalSpent: 294640,
          personalBalance: 18320,
          lastActivityAt,
        },
        {
          groupId: 'trip',
          currencyCode: 'USD',
          totalSpent: 2000,
          personalBalance: -1174,
          lastActivityAt: new Date('2026-08-30T12:00:00.000Z'),
        },
        {
          groupId: 'home',
          currencyCode: 'ARS',
          totalSpent: 0,
          personalBalance: 0,
          lastActivityAt: null,
        },
      ]),
    ).toEqual(
      new Map([
        [
          'trip',
          {
            totalSpentByCurrency: { ARS: 294640, USD: 2000 },
            personalBalanceByCurrency: { ARS: 18320, USD: -1174 },
            lastActivityAt: lastActivityAt.toISOString(),
          },
        ],
        [
          'home',
          {
            totalSpentByCurrency: {},
            personalBalanceByCurrency: { ARS: 0 },
            lastActivityAt: null,
          },
        ],
      ]),
    )
  })

  it('keeps the newest activity timestamp for a group', () => {
    expect(
      mergeGroupFinancialSummaryRows([
        {
          groupId: 'group-1',
          currencyCode: 'USD',
          totalSpent: 100,
          personalBalance: 0,
          lastActivityAt: new Date('2026-08-20T10:00:00.000Z'),
        },
        {
          groupId: 'group-1',
          currencyCode: 'EUR',
          totalSpent: 50,
          personalBalance: null,
          lastActivityAt: new Date('2026-08-22T10:00:00.000Z'),
        },
      ]).get('group-1')?.lastActivityAt,
    ).toBe('2026-08-22T10:00:00.000Z')
  })
})
