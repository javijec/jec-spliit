'use client'

import { CreateExpenseForm } from '@/app/groups/[groupId]/expenses/create-expense-form'
import { ExpenseFlowShell } from '@/app/groups/[groupId]/expenses/expense-flow-shell'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'

export function CreateExpenseModal({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  return (
    <ExpenseFlowShell groupId={groupId} title="Crear gasto">
      <CreateExpenseForm
        groupId={groupId}
        runtimeFeatureFlags={runtimeFeatureFlags}
      />
    </ExpenseFlowShell>
  )
}

