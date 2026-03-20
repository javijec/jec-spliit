'use client'
import { saveRecentGroup } from '@/app/groups/recent-groups-helpers'
import { trpc } from '@/trpc/client'
import { useEffect } from 'react'
import { useCurrentGroup } from './current-group-context'

export function SaveGroupLocally() {
  const { group } = useCurrentGroup()
  const { data: viewerData } = trpc.viewer.getCurrent.useQuery()
  const recordVisit = trpc.groups.recordVisit.useMutation()

  useEffect(() => {
    if (!group) return

    if (viewerData?.user) {
      recordVisit.mutate({ groupId: group.id })
      return
    }

    saveRecentGroup({ id: group.id, name: group.name })
  }, [group, recordVisit, viewerData?.user])

  return null
}
