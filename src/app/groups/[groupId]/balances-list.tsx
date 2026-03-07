import { EmptyState } from '@/components/ui/empty-state'
import { BalancesByCurrency } from '@/lib/balances'
import { Currency, getCurrency } from '@/lib/currency'
import { cn, formatCurrency } from '@/lib/utils'
import { Participant } from '@prisma/client'
import { Scale } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

type Props = {
  balancesByCurrency: BalancesByCurrency
  participants: Participant[]
  currency: Currency
}

export function BalancesList({
  balancesByCurrency,
  participants,
  currency,
}: Props) {
  const locale = useLocale()
  const t = useTranslations('Balances')
  const hasPendingBalances = Object.values(balancesByCurrency).some(
    (balances) => Object.values(balances).some((balance) => balance.total !== 0),
  )

  if (!hasPendingBalances) {
    return (
      <EmptyState
        icon={Scale}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    )
  }

  return (
    <div className="space-y-2.5">
      {participants.map((participant) => {
        const entries = Object.entries(balancesByCurrency)
          .map(([currencyCode, balances]) => ({
            currencyCode,
            total: balances[participant.id]?.total ?? 0,
          }))
          .filter(({ total }) => total !== 0)
          .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))

        const zeroCurrencyCode = currency.code || ''
        const visibleEntries =
          entries.length > 0
            ? entries
            : [{ currencyCode: zeroCurrencyCode, total: 0 }]

        return (
          <div
            key={participant.id}
            className="rounded-lg border bg-card/60 p-3 sm:p-4"
          >
            <div className="text-sm font-semibold truncate">
              {participant.name}
            </div>
            <div className="mt-2 space-y-1.5">
              {visibleEntries.map(({ currencyCode, total }, index) => {
                const targetCurrency =
                  currencyCode === currency.code
                    ? currency
                    : getCurrency(currencyCode)
                return (
                  <div
                    key={`${participant.id}-${currencyCode}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-2"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {currencyCode}
                    </span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        total > 0 && 'text-emerald-600 dark:text-emerald-400',
                        total < 0 && 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {formatCurrency(targetCurrency, total, locale)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
