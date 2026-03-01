import { BalancesByCurrency } from '@/lib/balances'
import { Currency, getCurrency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { Participant } from '@prisma/client'
import { useLocale } from 'next-intl'

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

  return (
    <div className="text-sm">
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
          <div key={participant.id} className="flex border-b last:border-b-0">
            <div className="w-1/2 p-2">{participant.name}</div>
            <div className="w-1/2 p-2 text-right">
              {visibleEntries.map(({ currencyCode, total }, index) => {
                const targetCurrency =
                  currencyCode === currency.code
                    ? currency
                    : getCurrency(currencyCode)
                return (
                  <div key={`${participant.id}-${currencyCode}-${index}`}>
                    {formatCurrency(targetCurrency, total, locale)}
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
