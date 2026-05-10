import { ExpenseFormValues } from '@/lib/schemas'
import { getPublicBalances } from '@/lib/balances'
import { RecurrenceRule, SplitMode } from '@prisma/client'

type GroupListItem = Awaited<ReturnType<typeof import('@/lib/user-memberships').getUserGroups>>[number]
type GroupDetails = Awaited<ReturnType<typeof import('@/lib/groups').getGroup>>
type GroupMembership = Awaited<ReturnType<typeof import('@/lib/user-memberships').getUserGroupMembership>>
type GroupExpense = Awaited<ReturnType<typeof import('@/lib/expenses').getGroupExpenses>>[number]

export function mapMobileGroupSummary(group: GroupListItem) {
  return {
    id: group.id,
    name: group.name,
    memberCount: group._count.participants,
    balanceSummary: `${group.currencyCode ?? group.currency} · ${group.isArchived ? 'Archivado' : 'Activo'}`,
    isFavorite: group.isStarred,
  }
}

export function mapMobileGroupDetail(
  group: NonNullable<GroupDetails>,
  membership: GroupMembership | null,
) {
  return {
    id: group.id,
    title: group.name,
    description: group.information ?? '',
    currency: group.currencyCode ?? group.currency,
    participants: group.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      linkedEmail: participant.appUser?.email ?? null,
    })),
    currentActiveParticipantId: membership?.activeParticipantId ?? null,
    currentUserRole: membership?.role ?? null,
  }
}

export function mapMobileExpense(expense: GroupExpense) {
  return {
    id: expense.id,
    title: expense.title,
    amount: expense.originalAmount ?? expense.amount,
    currency: expense.originalCurrency || null,
    paidBy: {
      id: expense.paidBy.id,
      name: expense.paidBy.name,
    },
    paidFor: expense.paidFor.map((item) => ({
      participantId: item.participant.id,
      participantName: item.participant.name,
      shares: item.shares,
    })),
    expenseDate: expense.expenseDate.toISOString(),
    isReimbursement: expense.isReimbursement,
  }
}

export function createEvenSplitExpensePayload(input: {
  title: string
  amount: number
  paidBy: string
  splitBetween: string[]
  currencyCode?: string | null
  expenseDate?: Date
  splitMode?: SplitMode
}): ExpenseFormValues {
  const paidFor =
    input.splitMode === SplitMode.BY_PERCENTAGE
      ? createPercentagePaidFor(input.splitBetween)
      : input.splitMode === SplitMode.BY_AMOUNT
        ? createAmountPaidFor(input.splitBetween, input.amount)
        : input.splitBetween.map((participantId) => ({
            participant: participantId,
            shares: 1,
          }))

  return {
    amount: input.amount,
    category: 0,
    conversionRate: undefined,
    documents: [],
    expenseDate: input.expenseDate ?? new Date(),
    isReimbursement: false,
    notes: '',
    originalAmount: undefined,
    originalCurrency: input.currencyCode ?? '',
    paidBy: input.paidBy,
    paidFor,
    recurrenceRule: RecurrenceRule.NONE,
    saveDefaultSplittingOptions: false,
    splitMode: input.splitMode ?? SplitMode.EVENLY,
    title: input.title,
  }
}

export function createReimbursementPayload(input: {
  amount: number
  fromParticipantId: string
  toParticipantId: string
  currencyCode?: string | null
  expenseDate?: Date
}): ExpenseFormValues {
  return {
    amount: input.amount,
    category: 0,
    conversionRate: undefined,
    documents: [],
    expenseDate: input.expenseDate ?? new Date(),
    isReimbursement: true,
    notes: '',
    originalAmount: undefined,
    originalCurrency: input.currencyCode ?? '',
    paidBy: input.fromParticipantId,
    paidFor: [
      {
        participant: input.toParticipantId,
        shares: input.amount,
      },
    ],
    recurrenceRule: RecurrenceRule.NONE,
    saveDefaultSplittingOptions: false,
    splitMode: SplitMode.BY_AMOUNT,
    title: 'Reembolso',
  }
}

export function mapMobileBalances(input: {
  balancesByCurrency: Record<string, ReturnType<typeof getPublicBalances>>
  reimbursements: Array<{
    from: string
    to: string
    amount: number
    currencyCode: string
  }>
}) {
  const balances = Object.entries(input.balancesByCurrency).flatMap(
    ([currencyCode, entries]) =>
      Object.entries(entries).map(([person, totals]) => ({
        person,
        currencyCode,
        total: totals.total,
      })),
  )

  return {
    balances,
    reimbursements: input.reimbursements,
  }
}

function createPercentagePaidFor(splitBetween: string[]) {
  if (splitBetween.length === 0) return []
  const total = 10000
  const base = Math.floor(total / splitBetween.length)
  let remainder = total - base * splitBetween.length

  return splitBetween.map((participantId) => {
    const extra = remainder > 0 ? 1 : 0
    remainder -= extra
    return {
      participant: participantId,
      shares: base + extra,
    }
  })
}

function createAmountPaidFor(splitBetween: string[], amount: number) {
  if (splitBetween.length === 0) return []
  const base = Math.floor(amount / splitBetween.length)
  let remainder = amount - base * splitBetween.length

  return splitBetween.map((participantId) => {
    const extra = remainder > 0 ? 1 : 0
    remainder -= extra
    return {
      participant: participantId,
      shares: base + extra,
    }
  })
}
