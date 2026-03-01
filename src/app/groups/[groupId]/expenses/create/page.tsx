import { CreateExpenseModal } from '@/app/groups/[groupId]/expenses/create/create-expense-modal'
import { getRuntimeFeatureFlags } from '@/lib/featureFlags'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Expense',
}

export default async function ExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  return (
    <CreateExpenseModal
      groupId={groupId}
      runtimeFeatureFlags={await getRuntimeFeatureFlags()}
    />
  )
}
