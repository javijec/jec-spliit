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
import { AppRouterOutput } from '@/trpc/routers/_app'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

type Participant = NonNullable<
  AppRouterOutput['groups']['get']['group']
>['participants'][number]

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
  const t = useTranslations('Balances.Reimbursements')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const createExpense = trpc.groups.expenses.create.useMutation({
    onSuccess: async () => {
      toast({
        title: t('paymentRegistered.title'),
        description: t('paymentRegistered.description'),
      })
      await Promise.all([
        utils.groups.balances.list.invalidate({ groupId }),
        utils.groups.expenses.list.invalidate({ groupId }),
        utils.groups.stats.get.invalidate({ groupId }),
        utils.groups.activities.list.invalidate({ groupId }),
      ])
    },
    onError: (error) => {
      toast({
        title: t('paymentErrorTitle'),
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
        description={t('noPendingDebtsDescription')}
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
    !!paymentDialog && (paymentDialog.mode === 'TOTAL' || isValidPartialAmount)

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
      <div className="space-y-2">
        {groupedReimbursements.map((pair) => (
          <div
            className="rounded-lg border border-border/70 bg-card p-3 shadow-sm shadow-black/5"
            key={`${pair.from}-${pair.to}`}
          >
            <div className="mb-2 flex items-center gap-1.5 text-sm leading-tight">
              <strong className="min-w-0 flex-1 truncate font-semibold tracking-tight">
                {getParticipant(pair.from)?.name ?? ''}
              </strong>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                <ArrowRight className="h-3 w-3" />
              </div>
              <strong className="min-w-0 flex-1 truncate text-right font-semibold tracking-tight">
                {getParticipant(pair.to)?.name ?? ''}
              </strong>
            </div>

            <div className="space-y-1.5">
              {pair.items.map((item) => {
                const reimbursementCurrency =
                  item.currencyCode === currency.code
                    ? currency
                    : getCurrency(item.currencyCode)

                return (
                  <div
                    key={`${pair.from}-${pair.to}-${item.currencyCode}`}
                    className="rounded-lg border border-border/70 bg-background px-2.5 py-2"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[0.75rem] font-medium text-muted-foreground">
                        {reimbursementCurrency.code}
                      </span>
                      <div
                        className={cn(
                          'text-sm font-semibold tabular-nums whitespace-nowrap text-primary sm:text-[0.95rem]',
                        )}
                      >
                        {formatCurrency(
                          reimbursementCurrency,
                          item.amount,
                          locale,
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <Button
                        variant="secondary"
                        className="h-8 rounded-md px-2 text-[11px] font-medium"
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
                        {t('actions.totalPayment')}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 rounded-md px-2 text-[11px] font-medium"
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
                        {t('actions.partialPayment')}
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
                ? t('confirm.total')
                : t('confirm.partial')}
            </DialogTitle>
            <DialogDescription>
              {paymentDialog &&
                t('paymentDescription', {
                  from: getParticipant(paymentDialog.from)?.name ?? '',
                  to: getParticipant(paymentDialog.to)?.name ?? '',
                  currency: paymentDialog.currencyCode,
                })}
            </DialogDescription>
          </DialogHeader>

          {paymentDialog && dialogCurrency && (
            <div className="space-y-3">
              {paymentDialog.mode === 'PARTIAL' && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t('partialAmountLabel')}
                  </div>
                  <Input
                    value={partialAmountInput}
                    onChange={(event) =>
                      setPartialAmountInput(event.target.value)
                    }
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

              <div className="space-y-1 rounded-lg border border-border/70 bg-secondary/20 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('summary.currentDebt')}
                  </span>
                  <strong>
                    {formatCurrency(
                      dialogCurrency,
                      paymentDialog.maxAmount,
                      locale,
                    )}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('summary.willRecord')}
                  </span>
                  <strong>
                    {formatCurrency(dialogCurrency, selectedMinorUnits, locale)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('summary.remaining')}
                  </span>
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
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={confirmPayment}
              disabled={!canConfirmPayment || createExpense.isPending}
            >
              {paymentDialog?.mode === 'TOTAL'
                ? t('confirm.total')
                : t('confirm.partial')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
