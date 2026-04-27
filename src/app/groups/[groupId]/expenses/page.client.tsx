'use client'

import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/page-header'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { Metadata } from 'next'
import { useTranslations } from 'next-intl'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Expenses',
}

export default function GroupExpensesPageClient() {
  const t = useTranslations('Expenses')

  return (
    <GroupSectionCard>
      <GroupSectionHeader>
        <SectionHeader
          title={t('title')}
          description={t('description')}
          meta={<Badge variant="outline">{t('title')}</Badge>}
        />
      </GroupSectionHeader>

      <GroupSectionContent className="relative flex flex-col gap-4 p-0">
        <ExpenseList />
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
