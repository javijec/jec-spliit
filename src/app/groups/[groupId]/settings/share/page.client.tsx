'use client'

import ExportButton from '@/app/groups/[groupId]/export-button'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'
import { FileOutput, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCurrentGroup } from '../../current-group-context'

export function ShareSettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const t = useTranslations('Settings')
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })

  if (isLoading || !data?.group) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  return (
    <GroupSectionCard>
      <GroupSectionHeader>
        <GroupSectionTitle className="text-xl leading-none">
          {t('shareAndExport')}
        </GroupSectionTitle>
        <GroupSectionDescription className="mt-2">
          {t('shareAndExportDescription')}
        </GroupSectionDescription>
      </GroupSectionHeader>
      <GroupSectionContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <ShareButton
            group={{ id: data.group.id, name: data.group.name }}
            showLabel
            size="default"
            variant="outline"
            className="w-full justify-center sm:w-auto"
          />
          <ExportButton
            groupId={groupId}
            showLabel
            size="default"
            variant="outline"
          />
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Info className="h-4 w-4" />
            {t('groupInformationTitle')}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
            {data.group.information?.trim() || t('emptyInformation')}
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <FileOutput className="h-4 w-4" />
            {t('exportInfoTitle')}
          </div>
          <p className="mt-2 text-muted-foreground">
            {t('exportInfoDescription')}
          </p>
        </div>
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
