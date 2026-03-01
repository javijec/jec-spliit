'use client'

import { CreateExpenseForm } from '@/app/groups/[groupId]/expenses/create-expense-form'
import { RuntimeFeatureFlags } from '@/lib/featureFlags'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CreateExpenseModal({
  groupId,
  runtimeFeatureFlags,
}: {
  groupId: string
  runtimeFeatureFlags: RuntimeFeatureFlags
}) {
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.push(`/groups/${groupId}`)
        }
      }}
    >
      <DialogContent className="w-[min(100vw-1rem,960px)] max-w-5xl h-[min(92dvh,920px)] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Crear gasto</DialogTitle>
        </DialogHeader>
        <div className="p-2 sm:p-4">
          <CreateExpenseForm
            groupId={groupId}
            runtimeFeatureFlags={runtimeFeatureFlags}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

