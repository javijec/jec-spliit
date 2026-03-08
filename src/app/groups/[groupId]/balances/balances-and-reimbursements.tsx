'use client'

import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
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
  const tSummary = useTranslations('Balances.summary')

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
    <div className="space-y-5">
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-44 rounded-sm" />
                <Skeleton className="h-7 w-36 rounded-sm" />
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 border bg-background px-2.5 py-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {reimbursementCount > 0
                    ? tSummary('pendingPayments', { count: reimbursementCount })
                    : tSummary('allClear')}
                </span>
                <span className="inline-flex items-center gap-1 border bg-background px-2.5 py-1">
                  <Layers3 className="h-3.5 w-3.5" />
                  {tSummary('currenciesInPlay', { count: currencyCount })}
                </span>
              </>
            )}
          </div>
          <GroupSectionTitle className="mt-3 flex items-center gap-2 text-xl leading-none">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            {t('Reimbursements.settlementsTitle')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {t('Reimbursements.description')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
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
        </GroupSectionContent>
      </GroupSectionCard>
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
      {Array(Math.max(2, participantCount - 1))
        .fill(undefined)
        .map((_, index) => (
          <div
            key={index}
            className="mb-3 flex items-start justify-between border bg-card px-4 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="mt-0.5 h-3 w-16" />
          </div>
        ))}
    </div>
  )
}
