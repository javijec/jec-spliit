'use client'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { trpc } from '@/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { ExpenseForm } from './expense-form'

export function EditExpenseForm({
  groupId,
  expenseId,
  runtimeFeatureFlags,
}: {
  groupId: string
  expenseId: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const { data: groupData } = trpc.groups.get.useQuery({ groupId })
  const group = groupData?.group

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

  if (!group || !categories || !expense) return null

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
          utils.groups.expenses.invalidate()
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
          utils.groups.expenses.invalidate()
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
