import { getUserGroups } from '@/lib/user-memberships'
import { protectedProcedure } from '@/trpc/init'

export const getMyGroupsProcedure = protectedProcedure.query(async ({ ctx }) => {
  const groups = await getUserGroups(ctx.auth.user.id)
  return { groups }
})
