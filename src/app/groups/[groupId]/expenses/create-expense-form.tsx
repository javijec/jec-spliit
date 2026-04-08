'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { trpc } from '@/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'
import { ExpenseForm } from './expense-form'

export function CreateExpenseForm({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  expenseId?: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const { group } = useCurrentGroup()

  const { data: categoriesData } = trpc.categories.list.useQuery()
  const categories = categoriesData?.categories

  const { mutateAsync: createExpenseMutateAsync } =
    trpc.groups.expenses.create.useMutation()

  const utils = trpc.useUtils()
  const router = useRouter()
  const { toast } = useToast()

  if (!group || !categories) return <ExpenseFormLoading />

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
          router.push(`/groups/${group.id}/expenses`)
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
