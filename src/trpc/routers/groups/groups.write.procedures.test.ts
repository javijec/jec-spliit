const updateGroupMock = jest.fn()
const createExpenseMock = jest.fn()
const updateExpenseMock = jest.fn()
const deleteExpenseMock = jest.fn()

jest.mock('@/lib/groups', () => ({
  updateGroup: (...args: unknown[]) => updateGroupMock(...args),
}))

jest.mock('@/lib/expenses', () => ({
  createExpense: (...args: unknown[]) => createExpenseMock(...args),
  updateExpense: (...args: unknown[]) => updateExpenseMock(...args),
  deleteExpense: (...args: unknown[]) => deleteExpenseMock(...args),
}))

jest.mock('@/lib/auth', () => ({
  getCurrentAuthSession: jest.fn(),
  getCurrentAppUser: jest.fn(),
}))

jest.mock('superjson', () => ({
  __esModule: true,
  default: {
    registerCustom: jest.fn(),
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id'),
}))

import { groupsRouter } from './index'

const expenseFormValues = {
  expenseDate: new Date('2026-03-20T00:00:00.000Z'),
  title: 'Cena',
  category: 0,
  amount: 12500,
  originalAmount: undefined,
  originalCurrency: '',
  conversionRate: undefined,
  paidBy: 'participant-1',
  paidFor: [
    {
      participant: 'participant-1',
      shares: 12500,
    },
  ],
  splitMode: 'EVENLY' as const,
  saveDefaultSplittingOptions: false,
  isReimbursement: false,
  documents: [],
  notes: '',
  recurrenceRule: 'NONE' as const,
}

function createCaller() {
  return groupsRouter.createCaller({
    auth: {
      session: null,
      user: null,
    },
  } as never)
}

describe('groups write procedures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes the selected participant through the group update procedure', async () => {
    updateGroupMock.mockResolvedValue(undefined)

    const caller = createCaller()
    await expect(
      caller.update({
        groupId: 'group-1',
        participantId: 'participant-1',
        groupFormValues: {
          name: 'Viaje',
          information: 'Vacaciones',
          currency: '$',
          currencyCode: 'USD',
          participants: [{ id: 'participant-1', name: 'Juan' }],
        },
      }),
    ).resolves.toBeUndefined()

    expect(updateGroupMock).toHaveBeenCalledWith(
      'group-1',
      {
        name: 'Viaje',
        information: 'Vacaciones',
        currency: '$',
        currencyCode: 'USD',
        participants: [{ id: 'participant-1', name: 'Juan' }],
      },
      'participant-1',
    )
  })

  it('uses the provided participant when creating, updating and deleting expenses', async () => {
    createExpenseMock.mockResolvedValue({ id: 'expense-1' })
    updateExpenseMock.mockResolvedValue({ id: 'expense-1' })
    deleteExpenseMock.mockResolvedValue(undefined)

    const caller = createCaller()

    await expect(
      caller.expenses.create({
        groupId: 'group-1',
        participantId: 'participant-1',
        expenseFormValues,
      }),
    ).resolves.toEqual({ expenseId: 'expense-1' })

    await expect(
      caller.expenses.update({
        groupId: 'group-1',
        expenseId: 'expense-1',
        participantId: 'participant-1',
        expenseFormValues,
      }),
    ).resolves.toEqual({ expenseId: 'expense-1' })

    await expect(
      caller.expenses.delete({
        groupId: 'group-1',
        expenseId: 'expense-1',
        participantId: 'participant-1',
      }),
    ).resolves.toEqual({})

    expect(createExpenseMock).toHaveBeenCalledWith(
      expenseFormValues,
      'group-1',
      'participant-1',
    )
    expect(updateExpenseMock).toHaveBeenCalledWith(
      'group-1',
      'expense-1',
      expenseFormValues,
      'participant-1',
    )
    expect(deleteExpenseMock).toHaveBeenCalledWith(
      'group-1',
      'expense-1',
      'participant-1',
    )
  })
})
