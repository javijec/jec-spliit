import { render, screen } from '@testing-library/react'
import messages from '../../../../messages/en-US.json'
import { RegisteredPaymentHistory } from './registered-payment-history'

let mockQuery: any

jest.mock('@/trpc/client', () => ({
  trpc: {
    groups: {
      reimbursements: {
        list: { useQuery: () => mockQuery },
      },
    },
  },
}))

jest.mock('./current-group-context', () => ({
  useCurrentGroup: () => ({
    groupId: 'group-1',
    group: { currency: '$', currencyCode: 'USD' },
    currentActiveParticipantId: 'alice',
  }),
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations:
    (namespace: string) => (key: string, values?: Record<string, string>) => {
      const message =
        [...namespace.split('.'), ...key.split('.')].reduce<any>(
          (value, part) => value?.[part],
          messages,
        ) ?? key
      return Object.entries(values ?? {}).reduce(
        (result, [name, value]) => result.replace(`{${name}}`, value),
        message,
      )
    },
}))

describe('RegisteredPaymentHistory', () => {
  beforeEach(() => {
    mockQuery = {
      isLoading: false,
      isError: false,
      data: { reimbursements: [] },
    }
  })

  it('renders an empty history state', () => {
    render(<RegisteredPaymentHistory />)
    expect(screen.getByText('No registered payments yet.')).toBeTruthy()
  })

  it('renders payer, payee, amount, currency, date, and active context', () => {
    mockQuery.data = {
      reimbursements: [
        {
          id: 'payment-1',
          amount: 15400,
          originalAmount: null,
          originalCurrency: 'USD',
          expenseDate: '2026-09-02T00:00:00.000Z',
          paidBy: { id: 'alice', name: 'Alice' },
          paidFor: [{ participant: { id: 'bob', name: 'Bob' } }],
        },
      ],
    }
    render(<RegisteredPaymentHistory />)

    expect(screen.getByText('Alice paid $154.00 to Bob')).toBeTruthy()
    expect(screen.getByText('You paid')).toBeTruthy()
  })
})
