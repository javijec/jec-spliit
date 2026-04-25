'use client'

import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/page-header'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { ShieldCheck, Users, UserRound, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCurrentGroup } from '../current-group-context'

export function SummaryPageClient() {
  const tSummary = useTranslations('Summary')
  const { group, viewer } = useCurrentGroup()
  const participantCount = group?.participants.length ?? 0

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
              </>
            }
          />
        </GroupSectionHeader>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <SectionHeader
            title={tSummary('participantsBadge', {
              count: participantCount,
            })}
            description={tSummary('participantLinksDescription')}
          />
        </GroupSectionHeader>
        <GroupSectionContent>
          <div className="space-y-2">
            {group?.participants.map((participant) => {
              const isLinked = !!participant.appUserId
              const isCurrentViewer =
                !!participant.appUserId &&
                participant.appUserId === viewer?.id

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3.5 py-3 text-sm shadow-sm shadow-black/5"
                >
                  <div className="min-w-0 font-medium tracking-tight">
                    {participant.name}
                  </div>
                  <div className="shrink-0">
                    {isLinked ? (
                      isCurrentViewer ? (
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
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </GroupSectionContent>
      </GroupSectionCard>
    </div>
  )
}
