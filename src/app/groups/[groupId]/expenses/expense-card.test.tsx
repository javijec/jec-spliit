import { fireEvent, render, screen } from '@testing-library/react'
import { ExpenseCard } from './expense-card'

const mockUseCurrentGroup = jest.fn()

jest.mock('../current-group-context', () => ({
  useCurrentGroup: () => mockUseCurrentGroup(),
}))

jest.mock('@/lib/api', () => ({
  getGroupExpenses: jest.fn(),
}))

jest.mock('./category-icon', () => ({
  CategoryIcon: () => <span data-testid="category-icon" />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))

jest.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const labels: Record<string, string> = {
      paidByLabel: 'Paid by',
      yourShare: 'Your share',
      payment: 'Payment',
      paymentRecorded: 'Registered payment',
      paymentDescription: '{payer} paid {payee}',
      documents: 'Attachments',
      edit: 'Edit expense',
      owes: 'Owes',
      nobody: 'Nobody',
      notInvolved: 'You are not involved',
    }
    return (labels[key] ?? key).replace(
      /\{(\w+)\}/g,
      (_, name: string) => values?.[name] ?? `{${name}}`,
    )
  },
}))

const currency = {
  name: 'US Dollar',
  symbol_native: '$',
  symbol: '$',
  code: 'USD',
  name_plural: 'US dollars',
  rounding: 0,
  decimal_digits: 2,
}

const expense = {
  amount: 12_000,
  category: { id: 1, grouping: 'Food and Drink', name: 'Dining Out' },
  expenseDate: new Date('2026-09-02T12:00:00.000Z'),
  id: 'expense-1',
  isReimbursement: false,
  originalAmount: null,
  originalCurrency: null,
  paidBy: { id: 'alice', name: 'Alice Example' },
  paidFor: [
    { participant: { id: 'alice', name: 'Alice Example' }, shares: 1 },
    { participant: { id: 'bob', name: 'Bob Example' }, shares: 1 },
  ],
  splitMode: 'EVENLY',
  title: 'Dinner with the whole group',
  _count: { documents: 0 },
}

function renderExpense(activeParticipantId: string | null) {
  mockUseCurrentGroup.mockReturnValue({
    currentActiveParticipantId: activeParticipantId,
  })

  return render(
    <ExpenseCard
      expense={expense as any}
      currency={currency}
      groupId="group-1"
    />,
  )
}

describe('ExpenseCard', () => {
  it('renders the expense hierarchy and active participant share', () => {
    renderExpense('alice')

    expect(screen.getByText('Dinner with the whole group')).toBeTruthy()
    expect(screen.getByText(/Paid by/)).toBeTruthy()
    expect(screen.getByText(/Your share.*60/)).toBeTruthy()
    expect(screen.getByText(/Sep 2, 2026/)).toBeTruthy()
  })

  it('shows excluded and missing participant states without fabricating a share', () => {
    const { unmount } = renderExpense('carol')
    expect(screen.getByText('You are not involved')).toBeTruthy()

    unmount()
    mockUseCurrentGroup.mockReturnValue({ currentActiveParticipantId: null })
    render(
      <ExpenseCard
        expense={expense as any}
        currency={currency}
        groupId="group-1"
      />,
    )
    expect(screen.queryByText(/Your share/)).toBeNull()
    expect(screen.queryByText('You are not involved')).toBeNull()
  })

  it('presents reimbursements as registered payments', () => {
    mockUseCurrentGroup.mockReturnValue({ currentActiveParticipantId: 'alice' })
    const reimbursement = {
      ...expense,
      isReimbursement: true,
      paidFor: [{ participant: { id: 'bob', name: 'Bob Example' }, shares: 1 }],
    }

    render(
      <ExpenseCard
        expense={reimbursement as any}
        currency={currency}
        groupId="group-1"
      />,
    )

    expect(screen.getByText('Payment')).toBeTruthy()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Registered payment')).toBeTruthy()
    expect(screen.getByText('Alice Example paid Bob Example')).toBeTruthy()
  })
})
