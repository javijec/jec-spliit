'use client'
import { saveRecentGroup } from '@/app/groups/recent-groups-helpers'
import { trpc } from '@/trpc/client'
import { useEffect, useRef } from 'react'
import { useCurrentGroup } from './current-group-context'

export function SaveGroupLocally() {
  const { group, viewer } = useCurrentGroup()
  const recordVisit = trpc.groups.recordVisit.useMutation()
  const lastSavedVisitKeyRef = useRef<string | null>(null)
  const { mutateAsync: recordVisitAsync } = recordVisit

  const groupId = group?.id
  const groupName = group?.name
  const viewerId = viewer?.id ?? null

  useEffect(() => {
    if (!groupId || !groupName) return

    const visitKey = viewerId ? `${viewerId}:${groupId}` : `guest:${groupId}`
    if (lastSavedVisitKeyRef.current === visitKey) return

    lastSavedVisitKeyRef.current = visitKey

    if (viewerId) {
      void recordVisitAsync({ groupId }).catch(() => {
        if (lastSavedVisitKeyRef.current === visitKey) {
          lastSavedVisitKeyRef.current = null
        }
      })
      return
    }

    saveRecentGroup({ id: groupId, name: groupName })
  }, [groupId, groupName, viewerId, recordVisitAsync])

  return null
}
