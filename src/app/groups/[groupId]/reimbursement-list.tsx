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
  activeParticipantId?: string | null
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
  activeParticipantId,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('Balances.Reimbursements')
  const utils = trpc.useUtils()
  const { toast } = useToast()
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState | null>(
    null,
  )
  const [partialAmountInput, setPartialAmountInput] = useState('')

  const closeDialog = () => {
    setPaymentDialog(null)
    setPartialAmountInput('')
  }

  const createReimbursement = trpc.groups.reimbursements.create.useMutation({
    onSuccess: async () => {
      closeDialog()
      toast({
        title: t('paymentRegistered.title'),
        description: t('paymentRegistered.description'),
      })
      await Promise.all([
        utils.groups.balances.list.invalidate({ groupId }),
        utils.groups.expenses.list.invalidate({ groupId }),
        utils.groups.reimbursements.list.invalidate({ groupId }),
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

  const groupedReimbursements = useMemo(() => {
    const sorted = [...reimbursements].sort((a, b) => {
      const aInvolvesActive =
        !!activeParticipantId &&
        (a.from === activeParticipantId || a.to === activeParticipantId)
      const bInvolvesActive =
        !!activeParticipantId &&
        (b.from === activeParticipantId || b.to === activeParticipantId)

      return (
        Number(bInvolvesActive) - Number(aInvolvesActive) ||
        b.amount - a.amount ||
        a.currencyCode.localeCompare(b.currencyCode) ||
        a.from.localeCompare(b.from) ||
        a.to.localeCompare(b.to)
      )
    })

    const groups = new Map<string, ReimbursementByCurrency[]>()
    for (const reimbursement of sorted) {
      const items = groups.get(reimbursement.currencyCode) ?? []
      items.push(reimbursement)
      groups.set(reimbursement.currencyCode, items)
    }

    return Array.from(groups.entries()).map(([currencyCode, items]) => ({
      currencyCode,
      items,
    }))
  }, [activeParticipantId, reimbursements])

  if (reimbursements.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title={t('noImbursements')}
        description={t('noPendingDebtsDescription')}
        className="mb-2 rounded-lg border-border/70 bg-card p-6"
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
  const hasValidDecimalPrecision =
    paymentDialog?.mode !== 'PARTIAL' ||
    (partialAmountInput.trim().split(/[.,]/)[1]?.length ?? 0) <=
      (dialogCurrency?.decimal_digits ?? 0)
  const selectedMinorUnits =
    paymentDialog && dialogCurrency
      ? paymentDialog.mode === 'TOTAL'
        ? paymentDialog.maxAmount
        : isValidPartialAmount
          ? amountAsMinorUnits(parsedPartialAmount, dialogCurrency)
          : 0
      : 0
  const exceedsRemainingDebt =
    paymentDialog?.mode === 'PARTIAL' &&
    selectedMinorUnits > (paymentDialog?.maxAmount ?? 0)
  const canConfirmPayment =
    !!paymentDialog &&
    (paymentDialog.mode === 'TOTAL' ||
      (isValidPartialAmount &&
        hasValidDecimalPrecision &&
        !exceedsRemainingDebt))

  const confirmPayment = () => {
    if (!paymentDialog || !dialogCurrency) return
    if (
      paymentDialog.mode === 'PARTIAL' &&
      (!isValidPartialAmount ||
        !hasValidDecimalPrecision ||
        exceedsRemainingDebt ||
        selectedMinorUnits <= 0)
    )
      return

    createReimbursement.mutate({
      groupId,
      from: paymentDialog.from,
      to: paymentDialog.to,
      currencyCode: paymentDialog.currencyCode,
      amount: selectedMinorUnits,
      participantId: activeParticipantId ?? undefined,
    })
  }

  return (
    <>
      <div className="space-y-2">
        {groupedReimbursements.map((group) => {
          const reimbursementCurrency =
            group.currencyCode === currency.code
              ? currency
              : getCurrency(group.currencyCode)

          return (
            <section
              key={group.currencyCode}
              aria-labelledby={`currency-${group.currencyCode}`}
            >
              <h3
                id={`currency-${group.currencyCode}`}
                className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {t('currencySectionLabel', { currency: group.currencyCode })}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const fromName = getParticipant(item.from)?.name ?? ''
                  const toName = getParticipant(item.to)?.name ?? ''
                  const involvesActive =
                    !!activeParticipantId &&
                    (item.from === activeParticipantId ||
                      item.to === activeParticipantId)

                  return (
                    <article
                      key={`${item.from}-${item.to}-${item.currencyCode}`}
                      className={cn(
                        'rounded-lg border border-success/20 bg-success/5 px-3 py-3 shadow-sm shadow-black/5',
                        involvesActive &&
                          'border-success/60 ring-1 ring-success/25',
                      )}
                      data-active-involved={involvesActive || undefined}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-background px-2.5 py-1 text-[0.7rem] font-medium tracking-wide text-muted-foreground">
                          {reimbursementCurrency.code}
                        </span>
                        <div className="rounded-full bg-background px-3 py-1 text-base font-semibold tabular-nums whitespace-nowrap text-success sm:text-lg">
                          {formatCurrency(
                            reimbursementCurrency,
                            item.amount,
                            locale,
                          )}
                        </div>
                      </div>

                      <div
                        className="mt-3 flex items-center gap-2 text-sm"
                        aria-label={t('paymentDescription', {
                          from: fromName,
                          to: toName,
                          currency: reimbursementCurrency.code,
                        })}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                          {fromName}
                        </span>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 truncate text-right font-medium text-foreground">
                          {toName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t('paymentDescription', {
                          from: fromName,
                          to: toName,
                          currency: reimbursementCurrency.code,
                        })}
                        {activeParticipantId === item.from && (
                          <span className="ml-1 font-medium text-danger">
                            {t('youPay')}
                          </span>
                        )}
                        {activeParticipantId === item.to && (
                          <span className="ml-1 font-medium text-success">
                            {t('youReceive')}
                          </span>
                        )}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 rounded-md px-2 text-[11px] font-medium"
                          disabled={createReimbursement.isPending}
                          aria-label={`${t('actions.totalPayment')}: ${fromName} → ${toName}`}
                          onClick={() =>
                            setPaymentDialog({
                              from: item.from,
                              to: item.to,
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
                          className="h-9 rounded-md px-2 text-[11px] font-medium"
                          disabled={createReimbursement.isPending}
                          aria-label={`${t('actions.partialPayment')}: ${fromName} → ${toName}`}
                          onClick={() => {
                            setPartialAmountInput('')
                            setPaymentDialog({
                              from: item.from,
                              to: item.to,
                              currencyCode: item.currencyCode,
                              maxAmount: item.amount,
                              mode: 'PARTIAL',
                            })
                          }}
                        >
                          {t('actions.partialPayment')}
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
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
                    <label
                      htmlFor="partial-payment-amount"
                      className="text-sm font-medium"
                    >
                      {t('partialAmountLabel')}
                    </label>
                  </div>
                  <Input
                    id="partial-payment-amount"
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
                    aria-invalid={
                      partialAmountInput.length > 0 && !canConfirmPayment
                    }
                    aria-describedby="partial-payment-max partial-payment-error"
                  />
                  <p
                    id="partial-payment-max"
                    className="text-xs text-muted-foreground"
                  >
                    {t('maximumAmount', {
                      amount: formatCurrency(
                        dialogCurrency,
                        paymentDialog.maxAmount,
                        locale,
                      ),
                    })}
                  </p>
                  {partialAmountInput.length > 0 && !canConfirmPayment && (
                    <p
                      id="partial-payment-error"
                      role="alert"
                      className="text-xs text-danger"
                    >
                      {exceedsRemainingDebt
                        ? t('amountExceedsRemaining')
                        : t('invalidAmount')}
                    </p>
                  )}
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
              disabled={!canConfirmPayment || createReimbursement.isPending}
              aria-busy={createReimbursement.isPending}
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
