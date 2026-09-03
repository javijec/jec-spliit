'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { getCurrency } from '@/lib/currency'
import { formatCurrency, getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { useLocale, useTranslations } from 'next-intl'
import { useCurrentGroup } from './current-group-context'

export function RegisteredPaymentHistory() {
  const { groupId, group, currentActiveParticipantId } = useCurrentGroup()
  const locale = useLocale()
  const t = useTranslations('Balances')
  const query = trpc.groups.reimbursements.list.useQuery(
    { groupId },
    { staleTime: 5 * 60 * 1000, refetchOnMount: false },
  )

  if (query.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (query.isError) {
    return <p className="text-sm text-danger">{t('registeredPaymentsError')}</p>
  }

  if (!query.data?.reimbursements.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('noRegisteredPayments')}
      </p>
    )
  }

  const groupCurrency = group ? getCurrencyFromGroup(group) : null

  return (
    <ul
      className="divide-y divide-border/70"
      aria-label={t('registeredPaymentsTitle')}
    >
      {query.data.reimbursements.map((payment) => {
        const payee = payment.paidFor[0]?.participant
        if (!payee) return null
        const paymentCurrency =
          payment.originalCurrency === groupCurrency?.code ||
          (!payment.originalCurrency && groupCurrency)
            ? groupCurrency
            : getCurrency(payment.originalCurrency)
        const amount = payment.originalAmount ?? payment.amount
        const activeCopy =
          currentActiveParticipantId === payment.paidBy.id
            ? t('paymentByYou')
            : currentActiveParticipantId === payee.id
              ? t('paymentToYou')
              : null

        return (
          <li key={payment.id} className="py-3 first:pt-0 last:pb-0">
            <p className="text-sm font-medium text-foreground">
              {t('registeredPaymentDescription', {
                payer: payment.paidBy.name,
                payee: payee.name,
                amount: formatCurrency(paymentCurrency, amount, locale),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
              }).format(new Date(payment.expenseDate))}
              {activeCopy && (
                <span className="ml-2 font-medium">{activeCopy}</span>
              )}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
