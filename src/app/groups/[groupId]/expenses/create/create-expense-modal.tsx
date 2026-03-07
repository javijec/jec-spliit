'use client'

import { CreateExpenseForm } from '@/app/groups/[groupId]/expenses/create-expense-form'
import { ExpenseFlowShell } from '@/app/groups/[groupId]/expenses/expense-flow-shell'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { useTranslations } from 'next-intl'

export function CreateExpenseModal({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const t = useTranslations('ExpenseFlow')
  return (
    <ExpenseFlowShell groupId={groupId} title={t('createTitle')}>
      <CreateExpenseForm
        groupId={groupId}
        runtimeFeatureFlags={runtimeFeatureFlags}
      />
    </ExpenseFlowShell>
  )
}

