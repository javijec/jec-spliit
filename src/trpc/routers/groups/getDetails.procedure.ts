import {
  getGroup,
  getGroupAccessControl,
  getGroupExpensesParticipants,
} from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const getGroupDetailsProcedure = baseProcedure
  .input(z.object({ groupId: z.string().min(1) }))
  .query(async ({ input: { groupId } }) => {
    const group = await getGroup(groupId)
    if (!group) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Group not found.',
      })
    }

    const participantsWithExpenses = await getGroupExpensesParticipants(groupId)
    const accessControl = await getGroupAccessControl(groupId)
    return {
      group,
      participantsWithExpenses,
      hasAccessPassword: accessControl?.hasAccessPassword ?? false,
    }
  })
