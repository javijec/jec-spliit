import { createGroup } from '@/lib/groups'
import { groupFormSchema } from '@/lib/schemas'
import { baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const createGroupProcedure = baseProcedure
  .input(
    z.object({
      groupFormValues: groupFormSchema,
      activeParticipantName: z.string().min(1).optional(),
    }),
  )
  .mutation(async ({ ctx, input: { groupFormValues, activeParticipantName } }) => {
    const group = await createGroup(groupFormValues, {
      userId: ctx.auth.user?.id,
      activeParticipantName,
      linkedUserName: ctx.auth.user?.displayName ?? ctx.auth.user?.email ?? undefined,
    })
    return { groupId: group.id }
  })
