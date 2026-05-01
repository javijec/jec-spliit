'use client'

import { BalancesList } from '@/app/groups/[groupId]/balances-list'
import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import { Badge } from '@/components/ui/badge'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { SectionHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrencyFromGroup } from '@/lib/utils'
import { trpc } from '@/trpc/client'
import { Layers3, Scale, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { useCurrentGroup } from '../current-group-context'

export default function BalancesAndReimbursements() {
  const { groupId, group } = useCurrentGroup()
  const utils = trpc.useUtils()
  const cachedBalances = useMemo(
    () => utils.groups.balances.list.getData({ groupId }),
    [groupId, utils.groups.balances.list],
  )
  const { data: balancesData, isLoading: balancesAreLoading } =
    trpc.groups.balances.list.useQuery(
      {
        groupId,
      },
      {
        placeholderData: cachedBalances,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
      },
    )
  const t = useTranslations('Balances')
  const tSummary = useTranslations('Balances.summary')

  const isLoading = balancesAreLoading || !balancesData || !group
  const reimbursementCount = balancesData?.reimbursements.length ?? 0
  const currencyCount = new Set(
    balancesData?.reimbursements.map((item) => item.currencyCode) ?? [],
  ).size

  return (
    <div className="space-y-3">
      <GroupSectionCard>
        <GroupSectionHeader>
          <SectionHeader
            title={t('Reimbursements.settlementsTitle')}
            description={t('Reimbursements.description')}
            meta={
              isLoading ? (
                <>
                  <Skeleton className="h-6 w-40 rounded-sm" />
                  <Skeleton className="h-6 w-32 rounded-sm" />
                </>
              ) : (
                <>
                  <Badge variant="outline">
                    <Wallet className="h-3.5 w-3.5" />
                    {reimbursementCount > 0
                      ? tSummary('pendingPayments', {
                          count: reimbursementCount,
                        })
                      : tSummary('allClear')}
                  </Badge>
                  <Badge variant="outline">
                    <Layers3 className="h-3.5 w-3.5" />
                    {tSummary('currenciesInPlay', { count: currencyCount })}
                  </Badge>
                </>
              )
            }
          />
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
      <GroupSectionCard>
        <GroupSectionHeader>
          <SectionHeader
            title={t('title')}
            description={t('description')}
            meta={
              isLoading ? (
                <Skeleton className="h-6 w-36 rounded-sm" />
              ) : (
                <Badge variant="outline">
                  <Scale className="h-3.5 w-3.5" />
                  {tSummary('currenciesInPlay', { count: currencyCount })}
                </Badge>
              )
            }
          />
        </GroupSectionHeader>
        <GroupSectionContent>
          {isLoading ? (
            <ReimbursementsLoading
              participantCount={group?.participants.length}
            />
          ) : (
            <BalancesList
              balancesByCurrency={balancesData.balancesByCurrency}
              participants={group.participants}
              currency={getCurrencyFromGroup(group)}
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
            className="mb-3 flex items-start justify-between rounded-lg border border-border/70 bg-card px-4 py-4 shadow-sm shadow-black/5"
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
