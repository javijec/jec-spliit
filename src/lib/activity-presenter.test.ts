import {
  parseActivityMetadata,
  serializeActivityExpenseSnapshot,
} from './activity'
import { getActivityPresentation } from './activity-presenter'

const expense = {
  id: 'expense-1',
  title: 'Dinner',
  amount: 4800,
  originalAmount: 4800,
  originalCurrency: 'USD',
  isReimbursement: false,
  paidBy: { id: 'participant-1', name: 'Javier' },
  paidFor: [{ participant: { id: 'participant-2', name: 'Ana' } }],
}

describe('activity metadata and presenter', () => {
  it('serializes and parses a payment snapshot without storing localized copy', () => {
    const parsed = parseActivityMetadata(
      serializeActivityExpenseSnapshot({
        title: 'Reimbursement',
        amount: 15680,
        originalAmount: 15680,
        originalCurrency: 'ARS',
        paidById: 'participant-1',
        paidForParticipantIds: ['participant-2'],
        isReimbursement: true,
      }),
    )

    expect(parsed).toEqual({
      version: 1,
      kind: 'payment',
      title: 'Reimbursement',
      amount: 15680,
      originalAmount: 15680,
      originalCurrency: 'ARS',
      paidById: 'participant-1',
      paidForParticipantIds: ['participant-2'],
    })
  })

  it.each([
    ['CREATE_EXPENSE', 'expenseCreated'],
    ['UPDATE_EXPENSE', 'expenseEdited'],
  ] as const)(
    'presents %s with its actor and resource',
    (activityType, kind) => {
      expect(
        getActivityPresentation({
          activityType,
          expenseId: expense.id,
          participant: { id: 'participant-1', name: 'Javier' },
          metadata: null,
          expense,
        }),
      ).toMatchObject({
        kind,
        actorName: 'Javier',
        title: 'Dinner',
        amount: 4800,
        currencyCode: 'USD',
        payerName: 'Javier',
        payeeName: 'Ana',
        resourceId: 'expense-1',
      })
    },
  )

  it('presents a deleted payment from metadata without linking to a missing expense', () => {
    const metadata = parseActivityMetadata(
      serializeActivityExpenseSnapshot({
        title: 'Reimbursement',
        amount: 15680,
        originalAmount: 15680,
        originalCurrency: 'ARS',
        paidById: 'participant-1',
        paidForParticipantIds: ['participant-2'],
        isReimbursement: true,
      }),
    )

    expect(
      getActivityPresentation({
        activityType: 'DELETE_EXPENSE',
        expenseId: 'deleted-expense',
        participant: null,
        metadata: { ...metadata!, paidByName: 'Javier', paidForName: 'Ana' },
      }),
    ).toMatchObject({
      kind: 'paymentDeleted',
      actorName: null,
      amount: 15680,
      currencyCode: 'ARS',
      payerName: 'Javier',
      payeeName: 'Ana',
      resourceId: null,
    })
  })

  it('uses neutral fallbacks for legacy activity data and unknown actors', () => {
    expect(parseActivityMetadata('Legacy title')).toBeNull()
    expect(
      getActivityPresentation({
        activityType: 'DELETE_EXPENSE',
        expenseId: 'deleted-expense',
        participant: null,
        metadata: null,
      }),
    ).toEqual({
      kind: 'expenseDeleted',
      actorName: null,
      title: null,
      amount: null,
      currencyCode: null,
      payerName: null,
      payeeName: null,
      resourceId: null,
    })
  })
})
