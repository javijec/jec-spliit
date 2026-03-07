import { EditExpenseForm } from '@/app/groups/[groupId]/expenses/edit-expense-form'
import { ExpenseFlowShell } from '@/app/groups/[groupId]/expenses/expense-flow-shell'
import { getRuntimeFeatureFlags } from '@/lib/featureFlags'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Edit Expense',
}

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>
}) {
  const { groupId, expenseId } = await params
  const t = await getTranslations('ExpenseFlow')
  return (
    <ExpenseFlowShell groupId={groupId} title={t('editTitle')}>
      <EditExpenseForm
        groupId={groupId}
        expenseId={expenseId}
        runtimeFeatureFlags={await getRuntimeFeatureFlags()}
      />
    </ExpenseFlowShell>
  )
}
