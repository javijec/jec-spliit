import { EmptyState } from '@/components/ui/empty-state'
import { BalancesByCurrency } from '@/lib/balances'
import { Currency, getCurrency } from '@/lib/currency'
import { formatCurrency } from '@/lib/utils'
import { Participant } from '@prisma/client'
import { Scale } from 'lucide-react'
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
  const hasPendingBalances = Object.values(balancesByCurrency).some(
    (balances) => Object.values(balances).some((balance) => balance.total !== 0),
  )

  if (!hasPendingBalances) {
    return (
      <EmptyState
        icon={Scale}
        title="No hay saldos pendientes"
        description="Todos los participantes están al día en todas las monedas."
      />
    )
  }

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
