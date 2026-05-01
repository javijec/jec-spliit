'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
} from '@/components/ui/group-section-card'
import {
  ArrowRight,
  HandCoins,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

export function SummaryPageClient() {
  const tSummary = useTranslations('Summary')
  const tTabs = useTranslations('GroupTabs')
  const tExpenseFlow = useTranslations('ExpenseFlow')
  const { group, groupDetails, groupSnapshot, viewer, groupId } =
    useCurrentGroup()
  const resolvedGroup = group ?? groupSnapshot?.group ?? null
  const resolvedGroupDetails =
    groupDetails ?? groupSnapshot?.groupDetails ?? null
  const participantCount = resolvedGroup?.participants.length ?? 0
  const linkedParticipants =
    resolvedGroup?.participants.filter(
      (participant) => participant.appUserId,
    ) ?? []
  const unlinkedParticipants =
    resolvedGroup?.participants.filter(
      (participant) => !participant.appUserId,
    ) ?? []
  const linkedParticipantIds = new Set(
    linkedParticipants.map((participant) => participant.id),
  )
  const linkedMembers = (resolvedGroupDetails?.members ?? []).filter(
    (member) =>
      member.activeParticipant &&
      linkedParticipantIds.has(member.activeParticipant.id),
  )
  const quickActions = [
    {
      href: `/groups/${groupId}/expenses/create`,
      label: tExpenseFlow('createTitle'),
      icon: Plus,
    },
    {
      href: `/groups/${groupId}/expenses`,
      label: tTabs('expenses'),
      icon: ReceiptText,
    },
    {
      href: `/groups/${groupId}/balances`,
      label: tTabs('balances'),
      icon: HandCoins,
    },
    {
      href: `/groups/${groupId}/settings`,
      label: tTabs('settings'),
      icon: Settings,
    },
  ]

  return (
    <div className="space-y-3">
      <GroupSectionCard>
        <GroupSectionContent>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <span className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
              {tSummary('participantsBadge', {
                count: participantCount,
              })}
            </span>
            {resolvedGroup?.currencyCode ? (
              <span className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
                {tSummary('defaultCurrencyBadge', {
                  currencyCode: resolvedGroup.currencyCode,
                })}
              </span>
            ) : null}
            <span className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs text-muted-foreground">
              {tSummary('linkedCountBadge', {
                count: linkedParticipants.length,
              })}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex min-h-20 flex-col justify-between rounded-lg border border-border/70 bg-background px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="leading-snug">{action.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight">
              {tSummary('accessTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tSummary('accessDescription')}
            </p>
          </div>

          <div className="space-y-2">
            {linkedMembers.map((member) => {
              const activeParticipant = member.activeParticipant
              const isCurrentViewer = member.userId === viewer?.id

              return (
                <div
                  key={`${member.userId}-${activeParticipant?.id ?? 'none'}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3 text-sm shadow-sm shadow-black/5"
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
            <div className="mt-4 rounded-lg border border-dashed border-border/70 bg-background px-3.5 py-3">
              <p className="text-sm font-medium">
                {tSummary('pendingAccessTitle')}
              </p>
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
