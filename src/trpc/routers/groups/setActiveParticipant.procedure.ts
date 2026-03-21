import { setUserActiveParticipant } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const setGroupActiveParticipantProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().min(1).nullable(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, participantId } }) => {
    await setUserActiveParticipant(
      ctx.auth.user.id,
      groupId,
      participantId,
      ctx.auth.user.displayName ?? ctx.auth.user.email ?? undefined,
    )
    return { success: true }
  })
