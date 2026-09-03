import type { ActivityMetadata } from './activity'

export type ActivityPresenterExpense = {
  id: string
  title: string
  amount: number
  originalAmount: number | null
  originalCurrency: string | null
  isReimbursement: boolean
  paidBy: { id: string; name: string }
  paidFor: Array<{ participant: { id: string; name: string } }>
}

export type ActivityPresenterItem = {
  activityType: string
  expenseId: string | null
  participant: { id: string; name: string } | null
  metadata: ActivityMetadata | null
  expense?: ActivityPresenterExpense
}

export type ActivityPresentation = {
  kind:
    | 'expenseCreated'
    | 'expenseEdited'
    | 'expenseDeleted'
    | 'paymentRecorded'
    | 'paymentEdited'
    | 'paymentDeleted'
    | 'groupUpdated'
    | 'unknown'
  actorName: string | null
  title: string | null
  amount: number | null
  currencyCode: string | null
  payerName: string | null
  payeeName: string | null
  resourceId: string | null
}

export function getActivityPresentation(
  activity: ActivityPresenterItem,
): ActivityPresentation {
  const metadata = activity.metadata
  const expense = activity.expense
  const isPayment = expense?.isReimbursement || metadata?.kind === 'payment'
  const title = expense?.title ?? metadata?.title ?? null
  const amount =
    expense?.originalAmount ??
    expense?.amount ??
    metadata?.originalAmount ??
    metadata?.amount ??
    null
  const currencyCode =
    expense?.originalCurrency ?? metadata?.originalCurrency ?? null
  const payerName = expense?.paidBy.name ?? metadata?.paidByName ?? null
  const payeeName =
    expense?.paidFor[0]?.participant.name ?? metadata?.paidForName ?? null
  const common = {
    actorName: activity.participant?.name ?? null,
    title,
    amount,
    currencyCode,
    payerName,
    payeeName,
    resourceId: expense?.id ?? null,
  }

  if (activity.activityType === 'CREATE_EXPENSE') {
    return {
      ...common,
      kind: isPayment ? 'paymentRecorded' : 'expenseCreated',
    }
  }

  if (activity.activityType === 'UPDATE_EXPENSE') {
    return {
      ...common,
      kind: isPayment ? 'paymentEdited' : 'expenseEdited',
    }
  }

  if (activity.activityType === 'DELETE_EXPENSE') {
    return {
      ...common,
      kind: isPayment ? 'paymentDeleted' : 'expenseDeleted',
      resourceId: null,
    }
  }

  if (activity.activityType === 'UPDATE_GROUP') {
    return { ...common, kind: 'groupUpdated' }
  }

  return { ...common, kind: 'unknown' }
}
