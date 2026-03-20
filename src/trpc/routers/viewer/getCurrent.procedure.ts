import { baseProcedure } from '@/trpc/init'

export const getCurrentViewerProcedure = baseProcedure.query(({ ctx }) => {
  return {
    user: ctx.auth.user,
  }
})
