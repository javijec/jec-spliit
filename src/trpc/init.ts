import { getCurrentAppUser, getCurrentAuthSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'
import { initTRPC } from '@trpc/server'
import { TRPCError } from '@trpc/server'
import { cache } from 'react'
import superjson from 'superjson'

superjson.registerCustom<Prisma.Decimal, string>(
  {
    isApplicable: (v): v is Prisma.Decimal => Prisma.Decimal.isDecimal(v),
    serialize: (v) => v.toJSON(),
    deserialize: (v) => new Prisma.Decimal(v),
  },
  'decimal.js',
)

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const session = await getCurrentAuthSession()
  const user = session ? await getCurrentAppUser() : null

  return {
    auth: {
      session,
      user,
    },
  }
})

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<TRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
})

// Base router and procedure helpers
export const createTRPCRouter = t.router
export const baseProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.auth.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        user: ctx.auth.user,
      },
    },
  })
})
