export type ActivityExpenseSnapshot = {
  version: 1
  kind: 'expense' | 'payment'
  title: string
  amount: number
  originalAmount: number | null
  originalCurrency: string | null
  paidById: string | null
  paidForParticipantIds: string[]
}

export type ActivityMetadata = ActivityExpenseSnapshot & {
  paidByName?: string | null
  paidForName?: string | null
}

type ActivitySnapshotInput = Omit<
  ActivityExpenseSnapshot,
  'version' | 'kind'
> & {
  isReimbursement: boolean
}

export function serializeActivityExpenseSnapshot(input: ActivitySnapshotInput) {
  const snapshot: ActivityExpenseSnapshot = {
    version: 1,
    kind: input.isReimbursement ? 'payment' : 'expense',
    title: input.title,
    amount: input.amount,
    originalAmount: input.originalAmount,
    originalCurrency: input.originalCurrency,
    paidById: input.paidById,
    paidForParticipantIds: input.paidForParticipantIds,
  }

  return JSON.stringify(snapshot)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseActivityMetadata(
  data: string | null,
): ActivityMetadata | null {
  if (!data) return null

  try {
    const parsed: unknown = JSON.parse(data)
    if (
      !isRecord(parsed) ||
      parsed.version !== 1 ||
      (parsed.kind !== 'expense' && parsed.kind !== 'payment') ||
      typeof parsed.title !== 'string' ||
      typeof parsed.amount !== 'number' ||
      !Number.isFinite(parsed.amount) ||
      !Array.isArray(parsed.paidForParticipantIds) ||
      !parsed.paidForParticipantIds.every((id) => typeof id === 'string')
    ) {
      return null
    }

    return {
      version: 1,
      kind: parsed.kind,
      title: parsed.title,
      amount: parsed.amount,
      originalAmount:
        typeof parsed.originalAmount === 'number'
          ? parsed.originalAmount
          : null,
      originalCurrency:
        typeof parsed.originalCurrency === 'string'
          ? parsed.originalCurrency
          : null,
      paidById: typeof parsed.paidById === 'string' ? parsed.paidById : null,
      paidForParticipantIds: parsed.paidForParticipantIds,
    }
  } catch {
    return null
  }
}
