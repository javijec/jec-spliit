'use client'
import { Currency } from '@/lib/currency'
import { cn, formatCurrency } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

export function TotalsYourShare({
  totalParticipantShare = 0,
  currency,
}: {
  totalParticipantShare?: number
  currency: Currency
}) {
  const locale = useLocale()
  const t = useTranslations('Stats.Totals')

  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">
        {t('yourShare')}
      </div>
      <div
        className={cn(
          'text-xl sm:text-2xl font-semibold tabular-nums mt-1',
          totalParticipantShare < 0 ? 'text-emerald-500' : 'text-red-500',
        )}
      >
        {formatCurrency(currency, Math.abs(totalParticipantShare), locale)}
      </div>
    </div>
  )
}
