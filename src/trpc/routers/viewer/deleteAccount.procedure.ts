import { deleteAppUserAccount } from '@/lib/auth'
import { protectedProcedure } from '@/trpc/init'

export const deleteViewerAccountProcedure = protectedProcedure.mutation(
  async ({ ctx }) => {
    await deleteAppUserAccount(ctx.auth.user.id)
    return { success: true }
  },
)
