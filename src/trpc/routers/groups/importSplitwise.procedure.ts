import {
  ImportedExpense,
  createGroupFromImportedExpenses,
} from '@/lib/groups'
import { groupFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

const importedExpenseSchema = z.object({
  expenseDate: z.coerce.date(),
  title: z.string().min(1),
  amount: z.number().int().positive(),
  currencyCode: z.string().min(1).max(3),
  paidByName: z.string().min(1),
  paidFor: z
    .array(
      z.object({
        participantName: z.string().min(1),
        shares: z.number().int().nonnegative(),
      }),
    )
    .min(1),
  isReimbursement: z.boolean(),
})

export const importSplitwiseProcedure = baseProcedure
  .input(
    z.object({
      groupFormValues: groupFormSchema,
      importedExpenses: z.array(importedExpenseSchema).min(1),
      activeParticipantName: z.string().min(1).optional(),
    }),
  )
  .mutation(
    async ({
      ctx,
      input: { groupFormValues, importedExpenses, activeParticipantName },
    }) => {
    const group = await createGroupFromImportedExpenses(
      groupFormValues,
      importedExpenses as ImportedExpense[],
      {
        userId: ctx.auth.user?.id,
        activeParticipantName,
        linkedUserName: ctx.auth.user?.displayName ?? ctx.auth.user?.email ?? undefined,
      },
    )
    return { groupId: group.groupId }
    },
  )
