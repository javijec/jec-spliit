'use client'

import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import ExportButton from '@/app/groups/[groupId]/export-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/page-header'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionHeader,
} from '@/components/ui/group-section-card'
import { Plus } from 'lucide-react'
import { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCurrentGroup } from '../current-group-context'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Expenses',
}

export default function GroupExpensesPageClient() {
  const t = useTranslations('Expenses')
  const { groupId } = useCurrentGroup()

  return (
    <GroupSectionCard>
      <GroupSectionHeader>
        <SectionHeader
          title={t('title')}
          description={t('description')}
          meta={<Badge variant="outline">{t('title')}</Badge>}
          actions={
            <>
              <ExportButton
                groupId={groupId}
                showLabel
                size="default"
                variant="outline"
              />
              <Button asChild size="default">
                <Link
                  href={`/groups/${groupId}/expenses/create`}
                  title={t('create')}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('create')}</span>
                </Link>
              </Button>
            </>
          }
        />
      </GroupSectionHeader>

      <GroupSectionContent className="relative flex flex-col gap-4 p-0">
        <ExpenseList />
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
