'use client'

import { AppRouterOutput } from '@/trpc/routers/_app'

type GroupData = NonNullable<AppRouterOutput['groups']['get']['group']>
type GroupDetails = AppRouterOutput['groups']['getDetails']

type StoredGroupSnapshot = {
  group: GroupData
  groupDetails: GroupDetails | null
  savedAt: number
}

const GROUP_SNAPSHOT_TTL_MS = 1000 * 60 * 60 * 12

function getSnapshotKey(userId: string | null, groupId: string) {
  return `nexogastos.group-snapshot:${userId ?? 'anon'}:${groupId}`
}

export function loadGroupSnapshot(userId: string | null, groupId: string) {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(getSnapshotKey(userId, groupId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredGroupSnapshot
    if (
      !parsed?.group ||
      !parsed.savedAt ||
      Date.now() - parsed.savedAt > GROUP_SNAPSHOT_TTL_MS
    ) {
      window.localStorage.removeItem(getSnapshotKey(userId, groupId))
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function saveGroupSnapshot(
  userId: string | null,
  groupId: string,
  snapshot: Omit<StoredGroupSnapshot, 'savedAt'>,
) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      getSnapshotKey(userId, groupId),
      JSON.stringify({
        ...snapshot,
        savedAt: Date.now(),
      } satisfies StoredGroupSnapshot),
    )
  } catch {
    // Ignore persistence failures and continue with in-memory cache.
  }
}
