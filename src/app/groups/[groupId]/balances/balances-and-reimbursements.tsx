'use client'

import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { CheckCircle2, Layers3, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useCurrentGroup } from '../current-group-context'

export default function BalancesAndReimbursements() {
  const utils = trpc.useUtils()
  const { groupId, group } = useCurrentGroup()
  const { data: balancesData, isLoading: balancesAreLoading } =
    trpc.groups.balances.list.useQuery({
      groupId,
    })
  const t = useTranslations('Balances')

  useEffect(() => {
    // Until we use tRPC more widely and can invalidate the cache on expense
    // update, it's easier and safer to invalidate the cache on page load.
    utils.groups.balances.invalidate()
  }, [utils])

  const isLoading = balancesAreLoading || !balancesData || !group
  const reimbursementCount = balancesData?.reimbursements.length ?? 0
  const currencyCount = new Set(
    balancesData?.reimbursements.map((item) => item.currencyCode) ?? [],
  ).size

  return (
    <div>
      <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-3 py-1">
              <Wallet className="h-3.5 w-3.5" />
              {reimbursementCount > 0
                ? t('summary.pendingPayments', { count: reimbursementCount })
                : t('summary.allClear')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border bg-background/70 px-3 py-1">
              <Layers3 className="h-3.5 w-3.5" />
              {t('summary.currenciesInPlay', { count: currencyCount })}
            </span>
          </div>
          <CardTitle className="mt-3 flex items-center gap-2 text-xl leading-none">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('description')}
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="mb-4 rounded-none -mx-4 border-x-0 sm:border-x sm:rounded-lg sm:mx-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b">
          <CardTitle className="text-xl leading-none">
            {t('Reimbursements.settlementsTitle')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('Reimbursements.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <ReimbursementsLoading
              participantCount={group?.participants.length}
            />
          ) : (
            <ReimbursementList
              reimbursements={balancesData.reimbursements}
              participants={group?.participants}
              currency={getCurrencyFromGroup(group)}
              groupId={groupId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const ReimbursementsLoading = ({
  participantCount = 3,
}: {
  participantCount?: number
}) => {
  return (
    <div className="flex flex-col">
      {Array(participantCount - 1)
        .fill(undefined)
        .map((_, index) => (
          <div key={index} className="flex justify-between py-5">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
    </div>
  )
}
