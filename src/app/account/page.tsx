import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { auth0Enabled } from '@/lib/env'
import { getCurrentAppUser, getCurrentAuthSession } from '@/lib/auth'
import { FolderKanban, LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { AccountProfileForm } from './account-profile-form'

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

export default async function AccountPage() {
  const t = await getTranslations('Account')
  const session = await getCurrentAuthSession()
  const user = session ? await getCurrentAppUser() : null

  if (!auth0Enabled || !session || !user) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-0 py-4 sm:px-4 lg:px-8">
        <GroupSectionCard>
          <GroupSectionHeader>
            <GroupSectionTitle className="text-xl leading-none">
              {t('signInTitle')}
            </GroupSectionTitle>
            <GroupSectionDescription className="mt-2">
              {t('signInDescription')}
            </GroupSectionDescription>
          </GroupSectionHeader>
          <GroupSectionContent>
            <Button asChild className="sm:w-auto">
              <a href="/auth/login?connection=google-oauth2">{t('signInAction')}</a>
            </Button>
          </GroupSectionContent>
        </GroupSectionCard>
      </div>
    )
  }

  const displayName = user.displayName || user.email || t('fallbackName')
  const joinedAtLabel = user.createdAt
    ? new Intl.DateTimeFormat(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(user.createdAt)
    : null

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-0 py-4 sm:px-4 lg:px-8">
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card text-lg font-semibold">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <GroupSectionTitle className="truncate text-xl leading-none">
                {displayName}
              </GroupSectionTitle>
              <GroupSectionDescription className="mt-2">
                {t('description')}
              </GroupSectionDescription>
              {user.email && (
                <p className="mt-3 text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
        </GroupSectionHeader>
        <GroupSectionContent className="grid gap-3 sm:grid-cols-2">
          <div className="border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserRound className="h-4 w-4" />
              {t('cards.profile')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('profileValue', { name: displayName })}
            </p>
          </div>
          <div className="border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              {t('cards.email')}
            </div>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {user.email || t('emailMissing')}
            </p>
          </div>
          <div className="border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              {t('cards.access')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('accessValue')}</p>
          </div>
          <div className="border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FolderKanban className="h-4 w-4" />
              {t('cards.account')}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {joinedAtLabel
                ? t('accountValueWithDate', { date: joinedAtLabel })
                : t('accountValue')}
            </p>
          </div>
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            {t('editNameTitle')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {t('editNameCardDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          <AccountProfileForm initialDisplayName={displayName} />
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            {t('actionsTitle')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {t('actionsDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="sm:w-auto">
            <Link href="/groups">
              <FolderKanban className="mr-2 h-4 w-4" />
              {t('groupsAction')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="sm:w-auto">
            <a href="/auth/logout">
              <LogOut className="mr-2 h-4 w-4" />
              {t('logoutAction')}
            </a>
          </Button>
        </GroupSectionContent>
      </GroupSectionCard>
    </div>
  )
}
