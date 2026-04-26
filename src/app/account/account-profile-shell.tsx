'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { PageContainer } from '@/components/ui/page-container'
import { SectionHeader } from '@/components/ui/page-header'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { FolderKanban, LogOut, Mail, ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { AccountProfileForm } from './account-profile-form'

type ViewerUser = NonNullable<AppRouterOutput['viewer']['getCurrent']['user']>

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

const formatJoinedAt = (value: ViewerUser['createdAt']) => {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3 text-sm shadow-sm shadow-black/5">
      <span className="shrink-0 font-medium text-foreground">{label}</span>
      <span className="text-right text-muted-foreground">{value}</span>
    </div>
  )
}

export function AccountProfileShell({
  initialUser,
}: {
  initialUser: ViewerUser
}) {
  const t = useTranslations('Account')
  const { data } = trpc.viewer.getCurrent.useQuery(undefined, {
    initialData: { user: initialUser },
    refetchOnMount: false,
  })

  const user = data?.user ?? initialUser
  const displayName = user.displayName || user.email || t('fallbackName')
  const joinedAtLabel = formatJoinedAt(user.createdAt)

  return (
    <PageContainer width="narrow">
      <div className="space-y-3">
        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={displayName}
              description={t('description')}
              meta={
                <>
                  <Badge variant="outline">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('cards.access')}
                  </Badge>
                  {joinedAtLabel ? (
                    <Badge variant="outline">{joinedAtLabel}</Badge>
                  ) : null}
                </>
              }
            />
          </GroupSectionHeader>
          <GroupSectionContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-background text-sm font-semibold text-foreground">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                ) : (
                  <span>{getInitials(displayName)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {displayName}
                </p>
                {user.email ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <InfoRow
                label={t('cards.profile')}
                value={t('profileValue', { name: displayName })}
              />
              <InfoRow
                label={t('cards.email')}
                value={user.email || t('emailMissing')}
              />
              <InfoRow label={t('cards.access')} value={t('accessValue')} />
              <InfoRow
                label={t('cards.account')}
                value={
                  joinedAtLabel
                    ? t('accountValueWithDate', { date: joinedAtLabel })
                    : t('accountValue')
                }
              />
            </div>
          </GroupSectionContent>
        </GroupSectionCard>

        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('actionsTitle')}
              description={t('actionsDescription')}
            />
          </GroupSectionHeader>
          <GroupSectionContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/groups">
                <FolderKanban className="mr-2 h-4 w-4" />
                {t('groupsAction')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href="/auth/logout">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logoutAction')}
              </a>
            </Button>
          </GroupSectionContent>
        </GroupSectionCard>

        <GroupSectionCard>
          <GroupSectionHeader>
            <SectionHeader
              title={t('editNameTitle')}
              description={t('editNameCardDescription')}
            />
          </GroupSectionHeader>
          <GroupSectionContent>
            <AccountProfileForm initialDisplayName={displayName} />
          </GroupSectionContent>
        </GroupSectionCard>
      </div>
    </PageContainer>
  )
}
