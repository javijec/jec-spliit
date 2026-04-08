'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { trpc } from '@/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'
import { ExpenseForm } from './expense-form'

async function invalidateExpenseData(
  utils: ReturnType<typeof trpc.useUtils>,
  groupId: string,
  expenseId: string,
) {
  await Promise.all([
    utils.groups.expenses.list.invalidate({ groupId }),
    utils.groups.expenses.get.invalidate({ groupId, expenseId }),
    utils.groups.balances.list.invalidate({ groupId }),
    utils.groups.stats.get.invalidate({ groupId }),
    utils.groups.activities.list.invalidate({ groupId }),
  ])
}

export function EditExpenseForm({
  groupId,
  expenseId,
  runtimeFeatureFlags,
}: {
  groupId: string
  expenseId: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const { group } = useCurrentGroup()

  const { data: categoriesData } = trpc.categories.list.useQuery()
  const categories = categoriesData?.categories

  const { data: expenseData } = trpc.groups.expenses.get.useQuery({
    groupId,
    expenseId,
  })
  const expense = expenseData?.expense

  const { mutateAsync: updateExpenseMutateAsync } =
    trpc.groups.expenses.update.useMutation()
  const { mutateAsync: deleteExpenseMutateAsync } =
    trpc.groups.expenses.delete.useMutation()

  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  if (!group || !categories || !expense) return <ExpenseFormLoading />

  return (
    <ExpenseForm
      group={group}
      expense={expense}
      categories={categories}
      onSubmit={async (expenseFormValues, participantId) => {
        try {
          await updateExpenseMutateAsync({
            expenseId,
            groupId,
            expenseFormValues,
            participantId,
          })
          toast({
            title: 'Gasto actualizado',
            description: 'Los cambios se guardaron correctamente.',
          })
          await invalidateExpenseData(utils, groupId, expenseId)
          router.push(`/groups/${group.id}/expenses`)
        } catch (error) {
          toast({
            title: 'No se pudo actualizar el gasto',
            description:
              error instanceof Error
                ? error.message
                : 'Ocurrió un error al actualizar el gasto.',
            variant: 'destructive',
          })
        }
      }}
      onDelete={async (participantId) => {
        try {
          await deleteExpenseMutateAsync({
            expenseId,
            groupId,
            participantId,
          })
          toast({
            title: 'Gasto eliminado',
            description: 'El gasto se eliminó correctamente.',
          })
          await invalidateExpenseData(utils, groupId, expenseId)
          router.push(`/groups/${group.id}/expenses`)
        } catch (error) {
          toast({
            title: 'No se pudo eliminar el gasto',
            description:
              error instanceof Error
                ? error.message
                : 'Ocurrió un error al eliminar el gasto.',
            variant: 'destructive',
          })
        }
      }}
      runtimeFeatureFlags={runtimeFeatureFlags}
    />
  )
}

function ExpenseFormLoading() {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b p-4 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="h-4 w-64 rounded-sm" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
        </CardContent>
      </Card>
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b p-4 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-4 w-56 rounded-sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <Skeleton className="h-16 rounded-sm" />
          <Skeleton className="h-16 rounded-sm" />
          <Skeleton className="h-16 rounded-sm" />
        </CardContent>
      </Card>
    </div>
  )
}
