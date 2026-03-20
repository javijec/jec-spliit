import { clearGroupAccessPassword } from '@/lib/groups'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const clearGroupAccessPasswordProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ input: { groupId, participantId } }) => {
    await clearGroupAccessPassword(groupId, participantId)
  })
