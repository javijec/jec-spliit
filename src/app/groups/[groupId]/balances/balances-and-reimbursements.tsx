'use client'

import { ReimbursementList } from '@/app/groups/[groupId]/reimbursement-list'
import { Badge } from '@/components/ui/badge'
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
import { useCurrentGroup } from '../current-group-context'

export default function BalancesAndReimbursements() {
  const { groupId, group } = useCurrentGroup()
  const { data: balancesData, isLoading: balancesAreLoading } =
    trpc.groups.balances.list.useQuery({
      groupId,
    })
  const t = useTranslations('Balances')
  const tSummary = useTranslations('Balances.summary')

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
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Wallet className="h-3.5 w-3.5" />
                {reimbursementCount > 0
                    ? tSummary('pendingPayments', { count: reimbursementCount })
                    : tSummary('allClear')}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                <Layers3 className="h-3.5 w-3.5" />
                {tSummary('currenciesInPlay', { count: currencyCount })}
              </Badge>
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
            className="mb-3 flex items-start justify-between rounded-2xl border border-border/70 bg-card/90 px-4 py-4 shadow-sm shadow-black/5"
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
