import { createTRPCRouter } from '@/trpc/init'
import { getCurrentViewerProcedure } from './getCurrent.procedure'

export const viewerRouter = createTRPCRouter({
  getCurrent: getCurrentViewerProcedure,
})
