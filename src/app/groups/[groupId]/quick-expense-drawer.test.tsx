import { act, fireEvent, render, screen } from '@testing-library/react'
import messages from '../../../../messages/en-US.json'
import { CurrentGroupProvider } from './current-group-context'
import {
  QuickExpenseProvider,
  QuickExpenseTrigger,
} from './quick-expense-drawer'

const mockMutate = jest.fn()
let mockMutationOptions: any
let mockIsPending = false
const mockToast = jest.fn()

jest.mock('@/trpc/client', () => ({
  trpc: {
    useUtils: () => ({
      groups: {
        expenses: { list: { invalidate: jest.fn() } },
        reimbursements: { list: { invalidate: jest.fn() } },
        balances: { list: { invalidate: jest.fn() } },
        stats: { get: { invalidate: jest.fn() } },
        activities: { list: { invalidate: jest.fn() } },
        mine: { invalidate: jest.fn() },
      },
    }),
    categories: {
      list: {
        useQuery: () => ({ data: { categories: [] }, isLoading: false }),
      },
    },
    groups: {
      expenses: {
        create: {
          useMutation: (options: any) => {
            mockMutationOptions = options
            return { isPending: mockIsPending, mutate: mockMutate }
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

jest.mock('@/components/category-selector', () => ({
  CategorySelector: () => <button type="button">Category</button>,
}))

jest.mock('@/components/currency-selector', () => ({
  CurrencySelector: () => <button type="button">Currency</button>,
}))

const group = {
  id: 'group-1',
  name: 'Weekend trip',
  currency: '$',
  currencyCode: 'USD',
  defaultSplitMode: 'EVENLY',
  defaultSplitShares: [],
  participants: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
  ],
}

function renderQuickAdd(activeParticipantId: string | null = 'alice') {
  return render(
    <CurrentGroupProvider
      isLoading={false}
      groupId="group-1"
      group={group as never}
      groupDetails={null}
      groupSnapshot={null}
      viewer={null}
      currentActiveParticipantId={activeParticipantId}
    >
      <QuickExpenseProvider>
        <QuickExpenseTrigger>Open quick add</QuickExpenseTrigger>
      </QuickExpenseProvider>
    </CurrentGroupProvider>,
  )
}

describe('QuickExpenseDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPending = false
  })

  it('opens with description, amount, payer, defaults, and full-form fallback', () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Open quick add' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByLabelText('Description')).toBeTruthy()
    expect(screen.getByLabelText('Amount')).toBeTruthy()
    expect((screen.getByLabelText('Paid by') as HTMLSelectElement).value).toBe(
      'alice',
    )
    expect(
      screen.getByRole('link', { name: 'Open full form' }).getAttribute('href'),
    ).toBe('/groups/group-1/expenses/create')
    fireEvent.click(screen.getByRole('button', { name: 'More options' }))
    expect(screen.getByText('General category')).toBeTruthy()
    expect((screen.getByLabelText('Split') as HTMLSelectElement).value).toBe(
      'EVENLY',
    )
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    )
    expect(screen.getByRole('button', { name: 'Currency' })).toBeTruthy()
  })

  it('reveals advanced options and submits a normal expense using minor units', async () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Open quick add' }))
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Dinner' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '12,50' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'More options' }))
    expect(screen.getByText('General category')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'group-1',
        expenseFormValues: expect.objectContaining({
          title: 'Dinner',
          amount: 1250,
          isReimbursement: false,
          paidBy: 'alice',
        }),
      }),
    )

    await act(async () => {
      await mockMutationOptions.onSuccess()
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('requires an explicit payer when no active participant exists', () => {
    renderQuickAdd(null)
    fireEvent.click(screen.getByRole('button', { name: 'Open quick add' }))
    expect((screen.getByLabelText('Paid by') as HTMLSelectElement).value).toBe(
      '',
    )
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Dinner' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(mockMutate).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('keeps the draft open after an error', () => {
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Open quick add' }))
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Dinner' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    act(() => {
      mockMutationOptions.onError(new Error('network error'))
    })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      (screen.getByLabelText('Description') as HTMLInputElement).value,
    ).toBe('Dinner')
  })

  it('disables double submit while pending', () => {
    mockIsPending = true
    renderQuickAdd()
    fireEvent.click(screen.getByRole('button', { name: 'Open quick add' }))
    expect(
      (screen.getByRole('button', { name: 'Saving…' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})
