'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { PageContainer } from '@/components/ui/page-container'
import { SectionHeader } from '@/components/ui/page-header'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { AsyncButton } from '@/components/async-button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LogOut, Mail, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ReactNode, useState } from 'react'
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

function InfoRow({
  label,
  value,
  action,
}: {
  label: string
  value: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-background px-3.5 py-3 text-sm shadow-sm shadow-black/5">
      <span className="shrink-0 font-medium text-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-right text-muted-foreground">{value}</span>
        {action}
      </div>
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
  const deleteAccount = trpc.viewer.deleteAccount.useMutation()

  const user = data?.user ?? initialUser
  const displayName = user.displayName || user.email || t('fallbackName')
  const joinedAtLabel = formatJoinedAt(user.createdAt)
  const [isEditingName, setIsEditingName] = useState(false)

  async function handleDeleteAccount() {
    await deleteAccount.mutateAsync()
    window.location.href = '/auth/logout'
  }

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
                action={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-md px-2.5"
                    onClick={() =>
                      setIsEditingName((currentValue) => !currentValue)
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('profileEditAction')}
                  </Button>
                }
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

            <Collapsible open={isEditingName} onOpenChange={setIsEditingName}>
              <CollapsibleContent className="overflow-hidden">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3.5">
                  <AccountProfileForm
                    initialDisplayName={displayName}
                    onSaved={() => setIsEditingName(false)}
                    onCancel={() => setIsEditingName(false)}
                    compact
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
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
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href="/auth/logout">
                <LogOut className="mr-2 h-4 w-4" />
                {t('logoutAction')}
              </a>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('deleteAccountAction')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('deleteAccountDescription')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">
                      {t('deleteAccountCancel')}
                    </Button>
                  </DialogClose>
                  <AsyncButton
                    type="button"
                    variant="destructive"
                    loadingContent={t('deleteAccountLoading')}
                    action={handleDeleteAccount}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('deleteAccountConfirm')}
                  </AsyncButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </GroupSectionContent>
        </GroupSectionCard>

      </div>
    </PageContainer>
  )
}
