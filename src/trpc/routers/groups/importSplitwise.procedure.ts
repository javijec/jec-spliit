import { ImportedExpense, createGroupFromImportedExpenses } from '@/lib/api'
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
    }),
  )
  .mutation(async ({ input: { groupFormValues, importedExpenses } }) => {
    const group = await createGroupFromImportedExpenses(
      groupFormValues,
      importedExpenses as ImportedExpense[],
    )
    return { groupId: group.groupId }
  })
