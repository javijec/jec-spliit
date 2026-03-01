import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { ReimbursementByCurrency } from '@/lib/balances'
import { Currency, getCurrency } from '@/lib/currency'
import {
  amountAsDecimal,
  amountAsMinorUnits,
  cn,
  formatCurrency,
} from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { Participant } from '@prisma/client'
import { CheckCircle2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

type Props = {
  reimbursements: ReimbursementByCurrency[]
  participants: Participant[]
  currency: Currency
  groupId: string
}

export function ReimbursementList({
  reimbursements,
  participants,
  currency,
  groupId,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('Balances.Reimbursements')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const createExpense = trpc.groups.expenses.create.useMutation({
    onSuccess: async () => {
      toast({
        title: 'Pago registrado',
        description: 'La deuda se marcó como pagada.',
      })
      await Promise.all([
        utils.groups.balances.invalidate(),
        utils.groups.expenses.invalidate(),
      ])
    },
    onError: (error) => {
      toast({
        title: 'No se pudo registrar el pago',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  const [partialAmounts, setPartialAmounts] = useState<Record<string, string>>(
    {},
  )

  const groupedReimbursements = useMemo(() => {
    const pairMap = new Map<
      string,
      {
        from: string
        to: string
        currencies: Map<string, number>
      }
    >()

    for (const reimbursement of reimbursements) {
      const pairKey = `${reimbursement.from}__${reimbursement.to}`
      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, {
          from: reimbursement.from,
          to: reimbursement.to,
          currencies: new Map<string, number>(),
        })
      }
      const pair = pairMap.get(pairKey)!
      const previous = pair.currencies.get(reimbursement.currencyCode) ?? 0
      pair.currencies.set(
        reimbursement.currencyCode,
        previous + reimbursement.amount,
      )
    }

    return Array.from(pairMap.values()).map((pair) => ({
      from: pair.from,
      to: pair.to,
      items: Array.from(pair.currencies.entries()).map(
        ([currencyCode, amount]) => ({
          currencyCode,
          amount,
        }),
      ),
    }))
  }, [reimbursements])

  if (reimbursements.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={t('noImbursements')}
        description="No hay deudas pendientes para saldar en este grupo."
        className="mb-2"
      />
    )
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id)
  return (
    <div className="space-y-2.5">
      {groupedReimbursements.map((pair) => (
        <div
          className="rounded-lg border bg-card/60 p-3 sm:p-4 flex flex-col gap-3"
          key={`${pair.from}-${pair.to}`}
        >
          <div className="text-sm">
            {t.rich('owes', {
              from: getParticipant(pair.from)?.name ?? '',
              to: getParticipant(pair.to)?.name ?? '',
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </div>

          <div className="space-y-2">
            {pair.items.map((item) => (
              (() => {
                const reimbursementCurrency =
                  item.currencyCode === currency.code
                    ? currency
                    : getCurrency(item.currencyCode)
                const itemId = `${pair.from}-${pair.to}-${item.currencyCode}`
                const rawAmount =
                  partialAmounts[itemId] ??
                  amountAsDecimal(
                    item.amount,
                    reimbursementCurrency,
                    true,
                  ).toString()
                const parsedAmount = Number(rawAmount.replace(',', '.'))
                const isValidPartialAmount =
                  Number.isFinite(parsedAmount) && parsedAmount > 0
                const selectedMinorUnits = isValidPartialAmount
                  ? Math.min(
                      item.amount,
                      amountAsMinorUnits(parsedAmount, reimbursementCurrency),
                    )
                  : item.amount

                return (
                  <div
                    key={itemId}
                    className="rounded-md bg-muted/50 px-2.5 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {reimbursementCurrency.code}
                      </span>
                      <div
                        className={cn(
                          'text-sm sm:text-base font-semibold tabular-nums whitespace-nowrap',
                          'text-amber-700 dark:text-amber-400',
                        )}
                      >
                        {formatCurrency(reimbursementCurrency, item.amount, locale)}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Input
                        className="w-full sm:w-[150px] h-9"
                        inputMode="decimal"
                        step={10 ** -reimbursementCurrency.decimal_digits}
                        value={rawAmount}
                        onChange={(event) =>
                          setPartialAmounts((prev) => ({
                            ...prev,
                            [itemId]: event.target.value,
                          }))
                        }
                        aria-label="Partial payment amount"
                      />
                      {isValidPartialAmount ? (
                        <Button
                          variant="secondary"
                          className="sm:ml-auto"
                          disabled={createExpense.isPending}
                          onClick={() =>
                            createExpense.mutate({
                              groupId,
                              expenseFormValues: {
                                title: 'Reimbursement',
                                expenseDate: new Date(),
                                amount: selectedMinorUnits,
                                originalCurrency:
                                  item.currencyCode === currency.code
                                    ? currency.code
                                    : item.currencyCode,
                                originalAmount:
                                  item.currencyCode === currency.code
                                    ? undefined
                                    : selectedMinorUnits,
                                conversionRate: undefined,
                                category: 1,
                                paidBy: pair.from,
                                paidFor: [
                                  {
                                    participant: pair.to,
                                    shares: 1,
                                  },
                                ],
                                isReimbursement: true,
                                splitMode: 'EVENLY',
                                saveDefaultSplittingOptions: false,
                                documents: [],
                                notes: '',
                                recurrenceRule: 'NONE',
                              },
                            })
                          }
                        >
                          {t('markAsPaid')}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          className="sm:ml-auto"
                          disabled
                        >
                          {t('markAsPaid')}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })()
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
