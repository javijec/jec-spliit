import { createTRPCRouter } from '@/trpc/init'
import { getCurrentViewerProcedure } from './getCurrent.procedure'
import { updateViewerProfileProcedure } from './updateProfile.procedure'

export const viewerRouter = createTRPCRouter({
  getCurrent: getCurrentViewerProcedure,
  updateProfile: updateViewerProfileProcedure,
})
