import { calculateShare } from '@/lib/totals'
import { SplitMode } from '@prisma/client'

type ExpenseShareInput = {
  amount: number
  isReimbursement: boolean
  splitMode: SplitMode
  paidFor: ReadonlyArray<{
    participant: { id: string }
    shares: number
  }>
}

/**
 * Returns the active participant's share in the expense's stored currency.
 * `null` means that the participant has no share (or the row is a payment),
 * while `undefined` means that no active participant was selected.
 */
export function getPersonalExpenseShare(
  participantId: string | null,
  expense: ExpenseShareInput,
  amount = expense.amount,
): number | null | undefined {
  if (!participantId) return undefined
  if (expense.isReimbursement) return null

  const participant = expense.paidFor.find(
    ({ participant }) => participant.id === participantId,
  )
  if (!participant) return null

  return calculateShare(participantId, {
    amount,
    isReimbursement: expense.isReimbursement,
    splitMode: expense.splitMode,
    paidFor: expense.paidFor.map(({ participant, shares }) => ({
      participantId: participant.id,
      shares,
    })),
  })
}
