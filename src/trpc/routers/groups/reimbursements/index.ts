import { createTRPCRouter } from '@/trpc/init'
import { createGroupReimbursementProcedure } from './create.procedure'
import { listGroupReimbursementsProcedure } from './list.procedure'

export const groupReimbursementsRouter = createTRPCRouter({
  create: createGroupReimbursementProcedure,
  list: listGroupReimbursementsProcedure,
})
