import { setUserActiveParticipant } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { requireGroupMembership } from './authorization'

export const setGroupActiveParticipantProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      participantId: z.string().min(1).nullable(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, participantId } }) => {
    await requireGroupMembership(ctx.auth.user.id, groupId)

    try {
      await setUserActiveParticipant(
        ctx.auth.user.id,
        groupId,
        participantId,
        ctx.auth.user.displayName ?? ctx.auth.user.email ?? undefined,
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
          cause: error,
        })
      }
      throw error
    }
    return { success: true }
  })
