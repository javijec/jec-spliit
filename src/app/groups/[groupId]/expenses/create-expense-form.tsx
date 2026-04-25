'use client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { trpc } from '@/trpc/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useCurrentGroup } from '../current-group-context'
import { ExpenseForm } from './expense-form'
import { ReceiptText } from 'lucide-react'

async function invalidateExpenseData(
  utils: ReturnType<typeof trpc.useUtils>,
  groupId: string,
) {
  await Promise.all([
    utils.groups.expenses.list.invalidate({ groupId }),
    utils.groups.balances.list.invalidate({ groupId }),
    utils.groups.stats.get.invalidate({ groupId }),
    utils.groups.activities.list.invalidate({ groupId }),
  ])
}

export function CreateExpenseForm({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  expenseId?: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const { group } = useCurrentGroup()

  const { data: categoriesData } = trpc.categories.list.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
  })
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
          await invalidateExpenseData(utils, groupId)
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
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/70">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              <ReceiptText className="h-3.5 w-3.5" />
              Nuevo gasto
            </Badge>
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="h-4 w-64 rounded-sm" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
          <Skeleton className="h-10 rounded-sm" />
        </CardContent>
      </Card>
      <Card className="overflow-hidden border-border/70">
        <CardHeader className="border-b border-border/70">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-sm" />
            <Skeleton className="h-4 w-56 rounded-sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 rounded-sm" />
          <Skeleton className="h-16 rounded-sm" />
          <Skeleton className="h-16 rounded-sm" />
        </CardContent>
      </Card>
    </div>
  )
}
