import { ActivityList } from '@/app/groups/[groupId]/activity/activity-list'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Metadata } from 'next'
import { useTranslations } from 'next-intl'

export const metadata: Metadata = {
  title: 'Activity',
}

export function ActivityPageClient() {
  const t = useTranslations('Activity')

  return (
    <>
      <GroupSectionCard className="mb-4">
        <GroupSectionHeader>
          <GroupSectionTitle>{t('title')}</GroupSectionTitle>
          <GroupSectionDescription>{t('description')}</GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="flex flex-col space-y-4">
          <ActivityList />
        </GroupSectionContent>
      </GroupSectionCard>
    </>
  )
}
