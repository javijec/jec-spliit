import { updateAppUserDisplayName } from '@/lib/auth'
import { protectedProcedure } from '@/trpc/init'
import { z } from 'zod'

export const updateViewerProfileProcedure = protectedProcedure
  .input(
    z.object({
      displayName: z.string().trim().min(2).max(50),
    }),
  )
  .mutation(async ({ ctx, input: { displayName } }) => {
    const user = await updateAppUserDisplayName(ctx.auth.user.id, displayName)
    return { user }
  })
