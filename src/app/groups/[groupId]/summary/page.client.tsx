'use client'

import { Badge } from '@/components/ui/badge'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
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
        <div className="sm:hidden">
          <GroupSectionContent className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Users className="h-3.5 w-3.5" />
                {tSummary('participantsBadge', {
                  count: participantCount,
                })}
              </Badge>
              {group?.currencyCode && (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {tSummary('defaultCurrencyBadge', {
                    currencyCode: group.currencyCode,
                  })}
                </Badge>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {tSummary('title')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tSummary('description')}
              </p>
            </div>
          </GroupSectionContent>
        </div>

        <div className="hidden sm:block">
          <GroupSectionHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Users className="h-3.5 w-3.5" />
                {tSummary('participantsBadge', {
                  count: participantCount,
                })}
              </Badge>
              {group?.currencyCode && (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  <Wallet className="h-3.5 w-3.5" />
                  {tSummary('defaultCurrencyBadge', {
                    currencyCode: group.currencyCode,
                  })}
                </Badge>
              )}
            </div>
            <GroupSectionTitle className="mt-3 text-xl leading-none">
              {tSummary('title')}
            </GroupSectionTitle>
            <GroupSectionDescription className="mt-2">
              {tSummary('description')}
            </GroupSectionDescription>
          </GroupSectionHeader>
        </div>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            {tSummary('participantsBadge', {
              count: participantCount,
            })}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-1.5">
            {tSummary('participantLinksDescription')}
          </GroupSectionDescription>
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
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 px-3.5 py-3 text-sm shadow-sm shadow-black/5"
                >
                  <div className="min-w-0 font-medium tracking-tight">
                    {participant.name}
                  </div>
                  <div className="shrink-0">
                    {isLinked ? (
                      isCurrentViewer ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-2.5 py-1 text-foreground"
                          title={tSummary('linkedYouBadge')}
                          aria-label={tSummary('linkedYouBadge')}
                        >
                          <UserRound className="h-3.5 w-3.5" />
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2.5 py-1 text-muted-foreground"
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
