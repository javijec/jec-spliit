'use client'

import { Badge } from '@/components/ui/badge'
import {
  GroupSectionCard,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'
import {
  ArrowRight,
  FileOutput,
  Pencil,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

function SettingsOptionCard({
  href,
  icon: Icon,
  title,
  description,
  destructive = false,
}: {
  href: string
  icon: typeof Pencil
  title: string
  description: string
  destructive?: boolean
}) {
  return (
    <Link
      href={href}
      className={[
        'flex min-h-28 flex-col justify-between rounded-2xl border bg-card/60 p-4 transition-colors hover:bg-card',
        destructive ? 'border-destructive/30' : '',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full',
          destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        ].join(' ')}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

export function SettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })

  if (isLoading || !data?.group) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card/70 p-5">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-7 w-40 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-64 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {t('participantsBadge', {
                count: data.group.participants.length,
              })}
            </Badge>
            {data.group.currencyCode && (
              <Badge variant="secondary">{data.group.currencyCode}</Badge>
            )}
            <Badge variant={data.hasAccessPassword ? 'default' : 'outline'}>
              {data.hasAccessPassword ? t('protected') : t('open')}
            </Badge>
          </div>
          <GroupSectionTitle className="mt-3 text-xl leading-none">
            {t('title')}
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            {t('hubDescription')}
          </GroupSectionDescription>
        </GroupSectionHeader>
      </GroupSectionCard>

      <div className="grid grid-cols-2 gap-3">
        <SettingsOptionCard
          href={`/groups/${groupId}/edit`}
          icon={Pencil}
          title={t('editGroup')}
          description={t('editGroupShort')}
        />
        <SettingsOptionCard
          href={`/groups/${groupId}/settings/share`}
          icon={FileOutput}
          title={t('shareAndExport')}
          description={t('shareAndExportShort')}
        />
        <SettingsOptionCard
          href={`/groups/${groupId}/settings/security`}
          icon={ShieldCheck}
          title={t('securityTitle')}
          description={t('securityShort')}
        />
        <SettingsOptionCard
          href={`/groups/${groupId}/settings/danger`}
          icon={Trash2}
          title={t('dangerZoneTitle')}
          description={t('dangerZoneShort')}
          destructive
        />
      </div>
    </div>
  )
}
