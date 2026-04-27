'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/page-header'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { trpc } from '@/trpc/client'
import {
  ArrowRight,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

export function SummaryPageClient() {
  const tSummary = useTranslations('Summary')
  const { group, viewer, groupId } = useCurrentGroup()
  const { data } = trpc.groups.getDetails.useQuery(
    { groupId },
    {
      staleTime: 5 * 60 * 1000,
    },
  )
  const participantCount = group?.participants.length ?? 0
  const linkedParticipants = group?.participants.filter((participant) => participant.appUserId) ?? []
  const unlinkedParticipants =
    group?.participants.filter((participant) => !participant.appUserId) ?? []
  const linkedMembers = data?.members ?? []

  return (
    <div className="space-y-3">
      <GroupSectionCard>
        <GroupSectionHeader>
          <SectionHeader
            title={tSummary('title')}
            description={tSummary('description')}
            meta={
              <>
                <Badge variant="outline">
                  <Users className="h-3.5 w-3.5" />
                  {tSummary('participantsBadge', {
                    count: participantCount,
                  })}
                </Badge>
                {group?.currencyCode ? (
                  <Badge variant="outline">
                    <Wallet className="h-3.5 w-3.5" />
                    {tSummary('defaultCurrencyBadge', {
                      currencyCode: group.currencyCode,
                    })}
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {tSummary('linkedCountBadge', {
                    count: linkedParticipants.length,
                  })}
                </Badge>
              </>
            }
          />
        </GroupSectionHeader>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <SectionHeader
            title={tSummary('accessTitle')}
            description={tSummary('accessDescription')}
          />
        </GroupSectionHeader>
        <GroupSectionContent>
          <div className="space-y-2">
            {linkedMembers.map((member) => {
              const activeParticipant = member.activeParticipant
              const isCurrentViewer = member.userId === viewer?.id

              return (
                <div
                  key={`${member.userId}-${activeParticipant?.id ?? 'none'}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-3 text-sm shadow-sm shadow-black/5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium tracking-tight">
                      {member.user.displayName ||
                        member.user.email ||
                        activeParticipant?.name ||
                        tSummary('accessFallback')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.user.email || tSummary('accessNoEmail')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tSummary('accessParticipant', {
                        participant:
                          activeParticipant?.name ?? tSummary('accessFallback'),
                      })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isCurrentViewer ? (
                      <Badge
                        variant="outline"
                        className="text-foreground"
                        title={tSummary('linkedYouBadge')}
                        aria-label={tSummary('linkedYouBadge')}
                      >
                        <UserRound className="h-3.5 w-3.5" />
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                        title={tSummary('linkedBadge')}
                        aria-label={tSummary('linkedBadge')}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {unlinkedParticipants.length > 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-background px-3.5 py-3">
              <p className="text-sm font-medium">{tSummary('pendingAccessTitle')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tSummary('pendingAccessDescription')}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unlinkedParticipants.map((participant) => (
                  <Badge key={participant.id} variant="outline">
                    {participant.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/groups/${groupId}/settings`}>
                {tSummary('manageAccessAction')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </GroupSectionContent>
      </GroupSectionCard>
    </div>
  )
}
