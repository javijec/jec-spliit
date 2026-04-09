'use client'

import { ExpenseList } from '@/app/groups/[groupId]/expenses/expense-list'
import ExportButton from '@/app/groups/[groupId]/export-button'
import { Badge } from '@/components/ui/badge'
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
    <GroupSectionCard>
      <div className="px-3 pb-2 pt-3 sm:hidden">
        <div className="flex items-start justify-between gap-3 px-1 py-1">
          <div className="min-w-0">
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {t('title')}
            </div>
            <h2 className="mt-1.5 text-lg font-semibold leading-none tracking-tight">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <ExportButton groupId={groupId} size="icon" variant="outline" />
        </div>
      </div>

      <div className="hidden sm:block">
        <GroupSectionHeader>
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {t('title')}
                  </Badge>
                </div>
                <GroupSectionTitle className="text-xl leading-none">
                  {t('title')}
                </GroupSectionTitle>
                <GroupSectionDescription className="max-w-2xl">
                  {t('description')}
                </GroupSectionDescription>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton
                  groupId={groupId}
                  showLabel
                  size="default"
                  variant="outline"
                />
                <Button asChild size="default" className="sm:px-3">
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
      </div>

      <GroupSectionContent className="relative flex flex-col gap-4 p-0">
        <ExpenseList />
      </GroupSectionContent>
    </GroupSectionCard>
  )
}
