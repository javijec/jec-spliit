import { setGroupAccessPassword } from '@/lib/api'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const setGroupAccessPasswordProcedure = baseProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      password: z.string().min(4),
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ input: { groupId, password, participantId } }) => {
    await setGroupAccessPassword(groupId, password, participantId)
  })
