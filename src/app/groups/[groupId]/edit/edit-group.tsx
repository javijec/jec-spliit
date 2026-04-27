'use client'

import { GroupForm } from '@/components/group-form'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'
import { AppRouterOutput } from '@/trpc/routers/_app'
import { useCurrentGroup } from '../current-group-context'

type GroupDetails = AppRouterOutput['groups']['getDetails']

export const EditGroup = ({
  groupDetails,
  mode = 'full',
}: {
  groupDetails?: GroupDetails
  mode?: 'full' | 'details' | 'participants'
}) => {
  const { groupId } = useCurrentGroup()
  const { data, isLoading } = trpc.groups.getDetails.useQuery(
    { groupId },
    {
      enabled: !groupDetails,
      placeholderData: groupDetails,
      staleTime: 5 * 60 * 1000,
    },
  )
  const { mutateAsync: mutateGroupAsync } = trpc.groups.update.useMutation()
  const { mutateAsync: setActiveParticipantAsync } =
    trpc.groups.setActiveParticipant.useMutation()
  const utils = trpc.useUtils()

  if (isLoading) {
    return <EditGroupSkeleton />
  }

  return (
    <div>
      <GroupForm
        group={data?.group}
        mode={mode}
        currentActiveParticipantId={data?.currentActiveParticipantId}
        onSubmit={async (groupFormValues, options) => {
          await mutateGroupAsync({
            groupId,
            participantId: options?.participantId,
            groupFormValues,
          })
          await setActiveParticipantAsync({
            groupId,
            participantId: options?.participantId ?? null,
          })
          await utils.groups.invalidate()
        }}
        protectedParticipantIds={data?.participantsWithExpenses}
      />
    </div>
  )
}

function EditGroupSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border bg-card p-6">
        <Skeleton className="h-7 w-40 rounded-sm" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border bg-card p-6">
          <Skeleton className="h-7 w-36 rounded-sm" />
          <Skeleton className="mt-2 h-4 w-52 rounded-sm" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-11 w-full rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
          </div>
        </div>

        <div className="border bg-card p-6">
          <Skeleton className="h-7 w-28 rounded-sm" />
          <Skeleton className="mt-2 h-4 w-44 rounded-sm" />
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-32 rounded-sm" />
            <Skeleton className="h-11 w-full rounded-sm" />
          </div>
        </div>
      </div>

      <Skeleton className="h-11 w-full rounded-sm sm:w-40" />
    </div>
  )
}
