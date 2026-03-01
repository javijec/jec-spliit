import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { ReimbursementByCurrency } from '@/lib/balances'
import { Currency, getCurrency } from '@/lib/currency'
import {
  amountAsDecimal,
  amountAsMinorUnits,
  formatCurrency,
} from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { Participant } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

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
  if (reimbursements.length === 0) {
    return <p className="text-sm pb-6">{t('noImbursements')}</p>
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id)
  return (
    <div className="text-sm">
      {reimbursements.map((reimbursement, index) => (
        <div className="py-4 flex justify-between gap-3" key={index}>
          <div className="flex flex-col gap-1 items-start sm:gap-2">
            <div>
              {t.rich('owes', {
                from: getParticipant(reimbursement.from)?.name ?? '',
                to: getParticipant(reimbursement.to)?.name ?? '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
            {(() => {
              const reimbursementCurrency =
                reimbursement.currencyCode === currency.code
                  ? currency
                  : getCurrency(reimbursement.currencyCode)
              const itemId = `${reimbursement.from}-${reimbursement.to}-${reimbursement.currencyCode}-${index}`
              const rawAmount =
                partialAmounts[itemId] ??
                amountAsDecimal(
                  reimbursement.amount,
                  reimbursementCurrency,
                  true,
                ).toString()
              const parsedAmount = Number(rawAmount.replace(',', '.'))
              const isValidPartialAmount =
                Number.isFinite(parsedAmount) && parsedAmount > 0
              const selectedMinorUnits = isValidPartialAmount
                ? Math.min(
                    reimbursement.amount,
                    amountAsMinorUnits(parsedAmount, reimbursementCurrency),
                  )
                : reimbursement.amount

              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Input
                    className="w-[110px] h-8"
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
                      variant="link"
                      className="-mx-4 -my-3"
                      disabled={createExpense.isPending}
                      onClick={() =>
                        createExpense.mutate({
                          groupId,
                          expenseFormValues: {
                            title: 'Reimbursement',
                            expenseDate: new Date(),
                            amount: selectedMinorUnits,
                            originalCurrency:
                              reimbursement.currencyCode === currency.code
                                ? currency.code
                                : reimbursement.currencyCode,
                            originalAmount:
                              reimbursement.currencyCode === currency.code
                                ? undefined
                                : selectedMinorUnits,
                            conversionRate: undefined,
                            category: 1,
                            paidBy: reimbursement.from,
                            paidFor: [
                              {
                                participant: reimbursement.to,
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
                    <Button variant="link" className="-mx-4 -my-3" disabled>
                      {t('markAsPaid')}
                    </Button>
                  )}
                </div>
              )
            })()}
          </div>
          <div>
            {formatCurrency(
              reimbursement.currencyCode === currency.code
                ? currency
                : getCurrency(reimbursement.currencyCode),
              reimbursement.amount,
              locale,
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
