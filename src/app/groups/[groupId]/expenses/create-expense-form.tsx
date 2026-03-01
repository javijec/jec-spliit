'use client'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { trpc } from '@/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { ExpenseForm } from './expense-form'

export function CreateExpenseForm({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  expenseId?: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const { data: groupData } = trpc.groups.get.useQuery({ groupId })
  const group = groupData?.group

  const { data: categoriesData } = trpc.categories.list.useQuery()
  const categories = categoriesData?.categories

  const { mutateAsync: createExpenseMutateAsync } =
    trpc.groups.expenses.create.useMutation()

  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  if (!group || !categories) return null

  return (
    <ExpenseForm
      group={group}
      categories={categories}
      onSubmit={async (expenseFormValues, participantId) => {
        try {
          await createExpenseMutateAsync({
            groupId,
            expenseFormValues,
            participantId,
          })
          toast({
            title: 'Gasto creado',
            description: 'El gasto se guardó correctamente.',
          })
          utils.groups.expenses.invalidate()
          router.push(`/groups/${group.id}`)
        } catch (error) {
          toast({
            title: 'No se pudo crear el gasto',
            description:
              error instanceof Error
                ? error.message
                : 'Ocurrió un error al guardar el gasto.',
            variant: 'destructive',
          })
        }
      }}
      runtimeFeatureFlags={runtimeFeatureFlags}
    />
  )
}
