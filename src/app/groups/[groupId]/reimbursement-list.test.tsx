import { getCurrency } from '@/lib/currency'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import messages from '../../../../messages/en-US.json'
import { ReimbursementList } from './reimbursement-list'

const mockMutate = jest.fn()
let mockMutationOptions: any
const mockToast = jest.fn()

jest.mock('@/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      groups: {
        balances: { list: { invalidate: jest.fn() } },
        expenses: { list: { invalidate: jest.fn() } },
        reimbursements: { list: { invalidate: jest.fn() } },
        stats: { get: { invalidate: jest.fn() } },
        activities: { list: { invalidate: jest.fn() } },
      },
    }),
    groups: {
      reimbursements: {
        create: {
          useMutation: (options: any) => {
            mockMutationOptions = options
            return { isPending: false, mutate: mockMutate }
          },
        },
      },
    },
  },
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
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

const participants = [
  {
    id: 'alice',
    name: 'Alice',
    groupId: 'group-1',
    appUserId: null,
    appUser: null,
  },
  {
    id: 'bob',
    name: 'Bob',
    groupId: 'group-1',
    appUserId: null,
    appUser: null,
  },
  {
    id: 'carol',
    name: 'Carol',
    groupId: 'group-1',
    appUserId: null,
    appUser: null,
  },
]

const currency = getCurrency('USD')

const renderList = (
  reimbursements = [
    { from: 'bob', to: 'alice', amount: 100, currencyCode: 'USD' },
    { from: 'bob', to: 'carol', amount: 20, currencyCode: 'EUR' },
    { from: 'alice', to: 'carol', amount: 10, currencyCode: 'USD' },
  ],
) =>
  render(
    <ReimbursementList
      reimbursements={reimbursements}
      participants={participants}
      currency={currency}
      groupId="group-1"
      activeParticipantId="bob"
    />,
  )

describe('ReimbursementList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders actionable payment cards grouped by currency and highlights the active participant', () => {
    renderList()

    expect(
      screen.getByRole('heading', { name: 'Payments in USD' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Payments in EUR' }),
    ).toBeTruthy()
    expect(screen.getAllByText('Bob')).toHaveLength(2)
    expect(screen.getAllByText('You pay')).toHaveLength(2)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(
      screen
        .getAllByRole('article')
        .filter((card) => card.dataset.activeInvolved === 'true'),
    ).toHaveLength(2)
    expect(
      screen
        .getAllByRole('article')
        .some((card) => !card.dataset.activeInvolved),
    ).toBe(true)
  })

  it('shows a positive settled state instead of an empty payment table', () => {
    renderList([])

    expect(
      screen.getByText(messages.Balances.Reimbursements.noImbursements),
    ).toBeTruthy()
    expect(screen.queryByRole('article')).toBeNull()
  })

  it('keeps the payment dialog open until success and gives toast feedback on error', async () => {
    renderList()
    fireEvent.click(
      screen.getAllByRole('button', { name: /Total payment: Bob → Alice/ })[0],
    )
    expect(await screen.findByRole('dialog')).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm total payment' }),
    )
    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog')).toBeTruthy()

    mockMutationOptions.onError(new Error('network error'))
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Could not record payment',
        variant: 'destructive',
      }),
    )

    await act(async () => {
      await mockMutationOptions.onSuccess()
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('rejects a partial amount above the remaining debt without mutating', () => {
    renderList([{ from: 'bob', to: 'alice', amount: 100, currencyCode: 'USD' }])
    fireEvent.click(
      screen.getByRole('button', { name: /Partial payment: Bob → Alice/ }),
    )
    fireEvent.change(screen.getByLabelText('Partial payment amount'), {
      target: { value: '1.01' },
    })

    expect(screen.getByRole('alert').textContent).toContain(
      'Amount cannot exceed the remaining debt.',
    )
    expect(
      (
        screen.getByRole('button', {
          name: 'Confirm partial payment',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('accepts comma decimal input for a valid partial payment', () => {
    renderList([
      { from: 'bob', to: 'alice', amount: 1000, currencyCode: 'USD' },
    ])
    fireEvent.click(
      screen.getByRole('button', { name: /Partial payment: Bob → Alice/ }),
    )
    fireEvent.change(screen.getByLabelText('Partial payment amount'), {
      target: { value: '5,50' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm partial payment' }),
    )

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 550, from: 'bob', to: 'alice' }),
    )
  })
})
