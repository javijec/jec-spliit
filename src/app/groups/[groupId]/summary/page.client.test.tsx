import { fireEvent, render, screen } from '@testing-library/react'
import messages from '../../../../../messages/en-US.json'
import { CurrentGroupProvider } from '../current-group-context'
import { SummaryPageClient } from './page.client'

const mockOpenActiveUserModal = jest.fn()
type MockStatsData = {
  totalSpentByCurrency: Record<string, number>
  personalBalanceByCurrency: Record<string, number>
  lastActivityAt: string | null
}
const mockStatsQuery = {
  isLoading: false,
  isError: false,
  data: {
    totalSpentByCurrency: { USD: 294640 },
    personalBalanceByCurrency: { USD: 18320 },
    lastActivityAt: '2026-08-30T00:00:00.000Z',
  } as MockStatsData,
}
const mockExpensesQuery = {
  isLoading: false,
  isError: false,
  data: {
    pages: [
      {
        hasMore: false,
        nextCursor: 5,
        expenses: [
          {
            id: 'expense-1',
            title: 'Hotel',
            amount: 294640,
            originalAmount: 294640,
            originalCurrency: 'USD',
            expenseDate: new Date('2026-08-30T00:00:00.000Z'),
            isReimbursement: false,
            paidBy: { id: 'participant-1', name: 'Javier' },
          },
        ],
      },
    ],
  },
}

jest.mock('@/trpc/client', () => ({
  trpc: {
    groups: {
      stats: { get: { useQuery: () => mockStatsQuery } },
      expenses: { list: { useInfiniteQuery: () => mockExpensesQuery } },
    },
  },
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations:
    (namespace: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const message =
        [...namespace.split('.'), ...key.split('.')].reduce<any>(
          (value, part) => value?.[part],
          messages,
        ) ?? key
      return Object.entries(values ?? {}).reduce(
        (result, [name, value]) => result.replace(`{${name}}`, String(value)),
        message,
      )
    },
}))

const group = {
  id: 'group-1',
  name: 'Weekend trip',
  currency: '$',
  currencyCode: 'USD',
  participants: [
    { id: 'participant-1', name: 'Javier', appUserId: 'user-1' },
    { id: 'participant-2', name: 'Ana', appUserId: null },
  ],
}

function renderSummary(activeParticipantId: string | null = 'participant-1') {
  return render(
    <CurrentGroupProvider
      isLoading={false}
      groupId="group-1"
      group={group as never}
      groupDetails={null}
      groupSnapshot={null}
      viewer={null}
      currentActiveParticipantId={activeParticipantId}
      openActiveUserModal={mockOpenActiveUserModal}
    >
      <SummaryPageClient />
    </CurrentGroupProvider>,
  )
}

describe('SummaryPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStatsQuery.data = {
      totalSpentByCurrency: { USD: 294640 },
      personalBalanceByCurrency: { USD: 18320 },
      lastActivityAt: '2026-08-30T00:00:00.000Z',
    }
    mockStatsQuery.isError = false
    mockExpensesQuery.data = {
      pages: [
        {
          hasMore: false,
          nextCursor: 5,
          expenses: [
            {
              id: 'expense-1',
              title: 'Hotel',
              amount: 294640,
              originalAmount: 294640,
              originalCurrency: 'USD',
              expenseDate: new Date('2026-08-30T00:00:00.000Z'),
              isReimbursement: false,
              paidBy: { id: 'participant-1', name: 'Javier' },
            },
          ],
        },
      ],
    }
    mockExpensesQuery.isError = false
  })

  it('renders totals, personal position, recent expenses, and real links', () => {
    renderSummary()

    expect(screen.getAllByText('$2,946.40')).toHaveLength(2)
    expect(screen.getByText('$183.20')).toBeTruthy()
    expect(screen.getByText('Hotel')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: /view all expenses/i })
        .getAttribute('href'),
    ).toBe('/groups/group-1/expenses')
    expect(
      screen
        .getByRole('link', { name: /view suggested payments/i })
        .getAttribute('href'),
    ).toBe('/groups/group-1/balances')
  })

  it('keeps multiple currency totals separate', () => {
    mockStatsQuery.data = {
      totalSpentByCurrency: { ARS: 294640, USD: 12000 },
      personalBalanceByCurrency: { ARS: -5000, USD: 0 },
      lastActivityAt: null,
    }

    renderSummary()

    expect(screen.getAllByText('ARS').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('USD').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('$120.00')).toBeTruthy()
  })

  it.each([
    ['positive', 18320, 'owed'],
    ['negative', -18320, 'owes'],
    ['settled', 0, 'even'],
  ])('renders the %s personal position state', (_, balance, state) => {
    mockStatsQuery.data.personalBalanceByCurrency = { USD: balance }

    renderSummary()

    expect(document.querySelector(`[data-position="${state}"]`)).toBeTruthy()
  })

  it('uses the existing active participant flow when no participant is selected', () => {
    renderSummary(null)

    expect(
      screen.getAllByText(messages.Summary.chooseParticipant).length,
    ).toBeGreaterThanOrEqual(1)
    fireEvent.click(
      screen.getAllByRole('button', { name: /choose your participant/i })[0],
    )
    expect(mockOpenActiveUserModal).toHaveBeenCalledTimes(1)
  })

  it('shows the empty expenses call to action', () => {
    mockExpensesQuery.data = {
      pages: [{ hasMore: false, nextCursor: 0, expenses: [] }],
    }

    renderSummary()

    expect(screen.getByText(messages.Summary.noExpensesYet)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /add expense/i }).getAttribute('href'),
    ).toBe('/groups/group-1/expenses/create')
  })
})
