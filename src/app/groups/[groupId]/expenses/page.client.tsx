'use client'

import { ActiveUserModal } from '@/app/groups/[groupId]/expenses/active-user-modal'
import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import ExportButton from '@/app/groups/[groupId]/export-button'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
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
    <>
      <GroupSectionCard>
        <GroupSectionHeader>
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <GroupSectionTitle className="text-xl leading-none">
                  {t('title')}
                </GroupSectionTitle>
                <GroupSectionDescription className="max-w-2xl">
                  {t('description')}
                </GroupSectionDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="sm:hidden">
                  <ExportButton groupId={groupId} size="icon" variant="outline" />
                </div>
                <div className="hidden sm:block">
                  <ExportButton
                    groupId={groupId}
                    showLabel
                    size="default"
                    variant="outline"
                  />
                </div>
                <Button asChild size="default" className="hidden sm:inline-flex sm:px-3">
                  <Link
                    href={`/groups/${groupId}/expenses/create`}
                    title={t('create')}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-2">{t('create')}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </GroupSectionHeader>

        <GroupSectionContent className="relative flex flex-col gap-4 p-0">
          <ExpenseList />
        </GroupSectionContent>
      </GroupSectionCard>

      <ActiveUserModal groupId={groupId} />
    </>
  )
}
