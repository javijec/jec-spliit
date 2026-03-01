import { Currency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

type Props = {
  totalGroupSpendings: number
  currency: Currency
}

export function TotalsGroupSpending({ totalGroupSpendings, currency }: Props) {
  const locale = useLocale()
  const t = useTranslations('Stats.Totals')
  const balance = totalGroupSpendings < 0 ? 'groupEarnings' : 'groupSpendings'
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">
        {t(balance)}
      </div>
      <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-1">
        {formatCurrency(currency, Math.abs(totalGroupSpendings), locale)}
      </div>
    </div>
  )
}
