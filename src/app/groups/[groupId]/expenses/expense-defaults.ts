import { Locale } from '@/i18n/request'
import { getCurrency } from '@/lib/currency'
import { ExpenseFormValues, SplittingOptions } from '@/lib/schemas'
import { amountAsMinorUnits, getCurrencyFromGroup } from '@/lib/utils'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { match } from 'ts-pattern'

export const getDefaultSplittingOptions = (
  group: NonNullable<AppRouterOutput['groups']['get']['group']>,
) => {
  const splitMode = group.defaultSplitMode ?? 'EVENLY'
  const configuredShares = Array.isArray(group.defaultSplitShares)
    ? (group.defaultSplitShares as Array<{
        participantId?: string
        shares?: number
      }>)
    : []
  const configuredSharesByParticipant = new Map(
    configuredShares
      .filter(
        (item): item is { participantId: string; shares: number } =>
          typeof item.participantId === 'string' &&
          typeof item.shares === 'number',
      )
      .map((item) => [item.participantId, item.shares]),
  )
  const defaultShares = match(splitMode)
    .with('BY_PERCENTAGE', () => {
      const share =
        group.participants.length > 0 ? 100 / group.participants.length : 0
      return group.participants.map(({ id }) => ({
        participant: id,
        shares: (
          configuredSharesByParticipant.get(id) ?? share
        ).toString() as any,
      }))
    })
    .otherwise(() =>
      group.participants.map(({ id }) => ({
        participant: id,
        shares: (configuredSharesByParticipant.get(id) ?? 1).toString() as any,
      })),
    )
  const defaultValue = { splitMode, paidFor: defaultShares }

  if (typeof localStorage === 'undefined') return defaultValue
  const stored = localStorage.getItem(`${group.id}-defaultSplittingOptions`)
  if (stored === null) return defaultValue
  const parsed = JSON.parse(stored) as SplittingOptions
  if (parsed.paidFor === null) parsed.paidFor = defaultValue.paidFor

  for (const paidFor of parsed.paidFor) {
    if (!group.participants.some(({ id }) => id === paidFor.participant)) {
      localStorage.removeItem(`${group.id}-defaultSplittingOptions`)
      return defaultValue
    }
  }

  return {
    splitMode: parsed.splitMode,
    paidFor: parsed.paidFor.map((paidFor) => ({
      participant: paidFor.participant,
      shares: (paidFor.shares / 100).toString() as any,
    })),
  }
}

export function prepareExpenseFormValuesForPersistence(
  values: ExpenseFormValues,
  group: NonNullable<AppRouterOutput['groups']['get']['group']>,
  locale: Locale | string,
) {
  const prepared = {
    ...values,
    paidFor: values.paidFor.map((item) => ({ ...item })),
  }
  const groupCurrency = getCurrencyFromGroup(group)
  const expenseCurrency =
    group.currencyCode &&
    prepared.originalCurrency &&
    prepared.originalCurrency !== group.currencyCode
      ? getCurrency(prepared.originalCurrency, locale as Locale, 'Custom')
      : groupCurrency

  prepared.amount = amountAsMinorUnits(prepared.amount, expenseCurrency)
  prepared.paidFor = prepared.paidFor.map(({ participant, shares }) => ({
    participant,
    shares:
      prepared.splitMode === 'BY_AMOUNT'
        ? amountAsMinorUnits(shares, expenseCurrency)
        : shares,
  }))

  const usesOriginalCurrency =
    !!group.currencyCode &&
    !!prepared.originalCurrency &&
    prepared.originalCurrency !== group.currencyCode
  if (!usesOriginalCurrency) {
    delete prepared.originalAmount
    delete prepared.originalCurrency
  } else {
    prepared.originalAmount = prepared.originalAmount ?? prepared.amount
    prepared.conversionRate = undefined
  }

  return prepared
}
