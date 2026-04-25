import { trpc } from '@/trpc/client'

export function updateCurrentActiveParticipantCache(
  utils: ReturnType<typeof trpc.useUtils>,
  groupId: string,
  participantId: string | null,
) {
  utils.groups.get.setData({ groupId }, (current) =>
    current
      ? {
          ...current,
          currentActiveParticipantId: participantId,
        }
      : current,
  )

  utils.groups.getDetails.setData({ groupId }, (current) =>
    current
      ? {
          ...current,
          currentActiveParticipantId: participantId,
        }
      : current,
  )
}
