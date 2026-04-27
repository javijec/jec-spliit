import { updateGroup } from '@/lib/groups'
import { groupFormSchema } from '@/lib/schemas'
import { protectedProcedure } from '@/trpc/init'
import { requireGroupOwner } from './authorization'
import { z } from 'zod'

export const updateGroupProcedure = protectedProcedure
  .input(
    z.object({
      groupId: z.string().min(1),
      groupFormValues: groupFormSchema,
      participantId: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input: { groupId, groupFormValues, participantId } }) => {
    await requireGroupOwner(ctx.auth.user.id, groupId)
    await updateGroup(groupId, groupFormValues, participantId)
  })
