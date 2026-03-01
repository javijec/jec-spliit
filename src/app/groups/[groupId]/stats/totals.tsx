'use client'
import { MonthlySpendingsChart } from '@/app/groups/[groupId]/stats/monthly-spendings-chart'
import { TotalsGroupSpending } from '@/app/groups/[groupId]/stats/totals-group-spending'
import { TotalsYourShare } from '@/app/groups/[groupId]/stats/totals-your-share'
import { TotalsYourSpendings } from '@/app/groups/[groupId]/stats/totals-your-spending'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveUser } from '@/lib/hooks'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { Info } from 'lucide-react'
import { useCurrentGroup } from '../current-group-context'

export function Totals() {
  const { groupId, group } = useCurrentGroup()
  const activeUser = useActiveUser(groupId)

  const participantId =
    activeUser && activeUser !== 'None' ? activeUser : undefined
  const { data } = trpc.groups.stats.get.useQuery({ groupId, participantId })

  if (!data || !group)
    return (
      <div className="grid gap-2.5">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-lg border bg-card/60 p-3">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2.5 h-6 w-36" />
          </div>
        ))}
      </div>
    )

  const {
    totalGroupSpendings,
    totalParticipantShare,
    totalParticipantSpendings,
    monthlySpendingsLastSixMonthsByCurrency,
  } = data

  const currency = getCurrencyFromGroup(group)

  return (
    <div className="grid gap-2.5">
      {!participantId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Tip</AlertTitle>
          <AlertDescription>
            Selecciona un usuario activo para ver tus metricas personales.
          </AlertDescription>
        </Alert>
      )}
      <MonthlySpendingsChart
        series={monthlySpendingsLastSixMonthsByCurrency}
        currency={currency}
      />
      <TotalsGroupSpending
        totalGroupSpendings={totalGroupSpendings}
        currency={currency}
      />
      {participantId && (
        <>
          <TotalsYourSpendings
            totalParticipantSpendings={totalParticipantSpendings}
            currency={currency}
          />
          <TotalsYourShare
            totalParticipantShare={totalParticipantShare}
            currency={currency}
          />
        </>
      )}
    </div>
  )
}
