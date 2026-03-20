import { createTRPCRouter } from '@/trpc/init'
import { activitiesRouter } from '@/trpc/routers/groups/activities'
import { groupBalancesRouter } from '@/trpc/routers/groups/balances'
import { clearGroupAccessPasswordProcedure } from '@/trpc/routers/groups/clearAccessPassword.procedure'
import { createGroupProcedure } from '@/trpc/routers/groups/create.procedure'
import { deleteGroupProcedure } from '@/trpc/routers/groups/delete.procedure'
import { groupExpensesRouter } from '@/trpc/routers/groups/expenses'
import { getGroupProcedure } from '@/trpc/routers/groups/get.procedure'
import { getMyGroupsProcedure } from '@/trpc/routers/groups/mine.procedure'
import { recordGroupVisitProcedure } from '@/trpc/routers/groups/recordVisit.procedure'
import { removeGroupMembershipProcedure } from '@/trpc/routers/groups/removeMembership.procedure'
import { setGroupAccessPasswordProcedure } from '@/trpc/routers/groups/setAccessPassword.procedure'
import { setGroupActiveParticipantProcedure } from '@/trpc/routers/groups/setActiveParticipant.procedure'
import { groupStatsRouter } from '@/trpc/routers/groups/stats'
import { syncLegacyGroupsProcedure } from '@/trpc/routers/groups/syncLegacy.procedure'
import { updateGroupProcedure } from '@/trpc/routers/groups/update.procedure'
import { updateGroupMembershipProcedure } from '@/trpc/routers/groups/updateMembership.procedure'
import { getGroupDetailsProcedure } from './getDetails.procedure'
import { importSplitwiseProcedure } from './importSplitwise.procedure'
import { listGroupsProcedure } from './list.procedure'

export const groupsRouter = createTRPCRouter({
  expenses: groupExpensesRouter,
  balances: groupBalancesRouter,
  stats: groupStatsRouter,
  activities: activitiesRouter,

  get: getGroupProcedure,
  getDetails: getGroupDetailsProcedure,
  list: listGroupsProcedure,
  mine: getMyGroupsProcedure,
  create: createGroupProcedure,
  importSplitwise: importSplitwiseProcedure,
  update: updateGroupProcedure,
  delete: deleteGroupProcedure,
  recordVisit: recordGroupVisitProcedure,
  syncLegacy: syncLegacyGroupsProcedure,
  updateMembership: updateGroupMembershipProcedure,
  removeMembership: removeGroupMembershipProcedure,
  setActiveParticipant: setGroupActiveParticipantProcedure,
  setAccessPassword: setGroupAccessPasswordProcedure,
  clearAccessPassword: clearGroupAccessPasswordProcedure,
})
