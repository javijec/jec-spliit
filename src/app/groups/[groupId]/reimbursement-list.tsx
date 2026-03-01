import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

type PaymentDialogState = {
  from: string
  to: string
  currencyCode: string
  maxAmount: number
  mode: 'TOTAL' | 'PARTIAL'
}

export function ReimbursementList({
  reimbursements,
  participants,
  currency,
  groupId,
}: Props) {
  const locale = useLocale()
  const isSpanish = locale.toLowerCase().startsWith('es')
  const labels = {
    paymentRegisteredTitle: isSpanish ? 'Pago registrado' : 'Payment recorded',
    paymentRegisteredDescription: isSpanish
      ? 'La deuda se marcó como pagada.'
      : 'The debt was marked as paid.',
    paymentErrorTitle: isSpanish
      ? 'No se pudo registrar el pago'
      : 'Could not record payment',
    noDebtsDescription: isSpanish
      ? 'No hay deudas pendientes para saldar en este grupo.'
      : 'There are no pending debts to settle in this group.',
    totalPayment: isSpanish ? 'Pago total' : 'Total payment',
    partialPayment: isSpanish ? 'Pago parcial' : 'Partial payment',
    confirmTotalPayment: isSpanish
      ? 'Confirmar pago total'
      : 'Confirm total payment',
    confirmPartialPayment: isSpanish
      ? 'Confirmar pago parcial'
      : 'Confirm partial payment',
    paysTo: isSpanish ? 'le paga a' : 'pays',
    inCurrency: isSpanish ? 'en' : 'in',
    partialAmount: isSpanish ? 'Monto del pago parcial' : 'Partial payment amount',
    currentDebt: isSpanish ? 'Deuda actual' : 'Current debt',
    willRecord: isSpanish ? 'Vas a registrar' : 'You are about to record',
    remaining: isSpanish ? 'Restante' : 'Remaining',
    cancel: isSpanish ? 'Cancelar' : 'Cancel',
  } as const
  const t = useTranslations('Balances.Reimbursements')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const createExpense = trpc.groups.expenses.create.useMutation({
    onSuccess: async () => {
      toast({
        title: labels.paymentRegisteredTitle,
        description: labels.paymentRegisteredDescription,
      })
      await Promise.all([
        utils.groups.balances.invalidate(),
        utils.groups.expenses.invalidate(),
      ])
    },
    onError: (error) => {
      toast({
        title: labels.paymentErrorTitle,
        description: error.message,
        variant: 'destructive',
      })
    },
  })
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(
    null,
  )
  const [partialAmountInput, setPartialAmountInput] = useState('')

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
        description={labels.noDebtsDescription}
        className="mb-2"
      />
    )
  }

  const getParticipant = (id: string) => participants.find((p) => p.id === id)
  const dialogCurrency = paymentDialog
    ? paymentDialog.currencyCode === currency.code
      ? currency
      : getCurrency(paymentDialog.currencyCode)
    : null
  const parsedPartialAmount = Number(partialAmountInput.replace(',', '.'))
  const isValidPartialAmount =
    Number.isFinite(parsedPartialAmount) && parsedPartialAmount > 0
  const selectedMinorUnits =
    paymentDialog && dialogCurrency
      ? paymentDialog.mode === 'TOTAL'
        ? paymentDialog.maxAmount
        : isValidPartialAmount
        ? Math.min(
            paymentDialog.maxAmount,
            amountAsMinorUnits(parsedPartialAmount, dialogCurrency),
          )
        : 0
      : 0
  const canConfirmPayment =
    !!paymentDialog &&
    (paymentDialog.mode === 'TOTAL' || isValidPartialAmount)

  const closeDialog = () => {
    setPaymentDialog(null)
    setPartialAmountInput('')
  }

  const confirmPayment = () => {
    if (!paymentDialog || !dialogCurrency) return
    if (paymentDialog.mode === 'PARTIAL' && !isValidPartialAmount) return

    createExpense.mutate({
      groupId,
      expenseFormValues: {
        title: 'Reimbursement',
        expenseDate: new Date(),
        amount: selectedMinorUnits,
        originalCurrency:
          paymentDialog.currencyCode === currency.code
            ? currency.code
            : paymentDialog.currencyCode,
        originalAmount:
          paymentDialog.currencyCode === currency.code
            ? undefined
            : selectedMinorUnits,
        conversionRate: undefined,
        category: 1,
        paidBy: paymentDialog.from,
        paidFor: [
          {
            participant: paymentDialog.to,
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
    closeDialog()
  }

  return (
    <>
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
              {pair.items.map((item) => {
                const reimbursementCurrency =
                  item.currencyCode === currency.code
                    ? currency
                    : getCurrency(item.currencyCode)

                return (
                  <div
                    key={`${pair.from}-${pair.to}-${item.currencyCode}`}
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

                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={createExpense.isPending}
                        onClick={() =>
                          setPaymentDialog({
                            from: pair.from,
                            to: pair.to,
                            currencyCode: item.currencyCode,
                            maxAmount: item.amount,
                            mode: 'TOTAL',
                          })
                        }
                      >
                        {labels.totalPayment}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={createExpense.isPending}
                        onClick={() => {
                          setPartialAmountInput('')
                          setPaymentDialog({
                            from: pair.from,
                            to: pair.to,
                            currencyCode: item.currencyCode,
                            maxAmount: item.amount,
                            mode: 'PARTIAL',
                          })
                        }}
                      >
                        {labels.partialPayment}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!paymentDialog}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentDialog?.mode === 'TOTAL'
                ? labels.confirmTotalPayment
                : labels.confirmPartialPayment}
            </DialogTitle>
            <DialogDescription>
              {paymentDialog &&
                `${getParticipant(paymentDialog.from)?.name ?? ''} ${labels.paysTo} ${
                  getParticipant(paymentDialog.to)?.name ?? ''
                } ${labels.inCurrency} ${paymentDialog.currencyCode}.`}
            </DialogDescription>
          </DialogHeader>

          {paymentDialog && dialogCurrency && (
            <div className="space-y-3">
              {paymentDialog.mode === 'PARTIAL' && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">{labels.partialAmount}</div>
                  <Input
                    value={partialAmountInput}
                    onChange={(event) => setPartialAmountInput(event.target.value)}
                    placeholder={amountAsDecimal(
                      paymentDialog.maxAmount,
                      dialogCurrency,
                      true,
                    ).toString()}
                    inputMode="decimal"
                    step={10 ** -dialogCurrency.decimal_digits}
                  />
                </div>
              )}

              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{labels.currentDebt}</span>
                  <strong>
                    {formatCurrency(
                      dialogCurrency,
                      paymentDialog.maxAmount,
                      locale,
                    )}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{labels.willRecord}</span>
                  <strong>
                    {formatCurrency(dialogCurrency, selectedMinorUnits, locale)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{labels.remaining}</span>
                  <strong>
                    {formatCurrency(
                      dialogCurrency,
                      Math.max(paymentDialog.maxAmount - selectedMinorUnits, 0),
                      locale,
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              {labels.cancel}
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={!canConfirmPayment || createExpense.isPending}
            >
              {paymentDialog?.mode === 'TOTAL'
                ? labels.confirmTotalPayment
                : labels.confirmPartialPayment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
