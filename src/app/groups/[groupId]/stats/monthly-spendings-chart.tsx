'use client'

import { Currency, getCurrency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'

type MonthSpending = {
  year: number
  month: number
  total: number
}

type CurrencySeries = {
  currencyCode: string
  months: MonthSpending[]
}

export function MonthlySpendingsChart({
  series,
  currency,
}: {
  series: CurrencySeries[]
  currency: Currency
}) {
  const locale = useLocale()
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
  })

  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">
        Ultimos 6 meses por moneda
      </div>
      <div className="mt-3 space-y-4">
        {series.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin gastos en los ultimos 6 meses.
          </p>
        ) : (
          series.map((currencySeries) => {
            const targetCurrency =
              currencySeries.currencyCode === currency.code
                ? currency
                : getCurrency(currencySeries.currencyCode)
            const max = Math.max(
              ...currencySeries.months.map((item) => item.total),
              1,
            )
            const total = currencySeries.months.reduce(
              (sum, month) => sum + month.total,
              0,
            )
            const average = total / currencySeries.months.length
            const peakMonth = currencySeries.months.reduce((best, current) =>
              current.total > best.total ? current : best,
            )
            const peakMonthLabel = monthFormatter.format(
              new Date(Date.UTC(peakMonth.year, peakMonth.month, 1)),
            )

            return (
              <div key={currencySeries.currencyCode} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {currencySeries.currencyCode}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] tabular-nums">
                      Promedio:{' '}
                      {formatCurrency(targetCurrency, average, locale)}
                    </span>
                    <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] tabular-nums">
                      Pico {peakMonthLabel}:{' '}
                      {formatCurrency(targetCurrency, peakMonth.total, locale)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {currencySeries.months.map((item) => {
                    const monthDate = new Date(Date.UTC(item.year, item.month, 1))
                    const label = monthFormatter.format(monthDate)
                    const widthPercent =
                      item.total <= 0
                        ? 0
                        : Math.max(6, Math.round((item.total / max) * 100))
                    return (
                      <div
                        key={`${currencySeries.currencyCode}-${item.year}-${item.month}`}
                        className="rounded-md border bg-muted/30 p-2"
                      >
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-1 text-[10px] font-medium tabular-nums leading-tight break-words">
                          {formatCurrency(targetCurrency, item.total, locale)}
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/85 transition-all duration-300"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
