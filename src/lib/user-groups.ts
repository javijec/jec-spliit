import { RecentGroups } from '@/app/groups/recent-groups-helpers'

export interface StoredUserGroup {
  groupId: string
  groupName: string
  lastAccessedAt: string
  isArchived: boolean
  isStarred: boolean
}

export interface UserGroupSyncState {
  storedGroups: StoredUserGroup[]
  recentGroups: RecentGroups
  starredGroupIds: string[]
  archivedGroupIds: string[]
  now?: Date
}

function toTimestamp(date: string) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

export function mergeUserGroups({
  storedGroups,
  recentGroups,
  starredGroupIds,
  archivedGroupIds,
  now = new Date(),
}: UserGroupSyncState): StoredUserGroup[] {
  const merged = new Map(
    storedGroups.map((group) => [
      group.groupId,
      {
        ...group,
        isArchived: Boolean(group.isArchived),
        isStarred: Boolean(group.isStarred),
      },
    ]),
  )

  for (const group of recentGroups) {
    if (merged.has(group.id)) continue

    merged.set(group.id, {
      groupId: group.id,
      groupName: group.name,
      lastAccessedAt: now.toISOString(),
      isArchived: archivedGroupIds.includes(group.id),
      isStarred: starredGroupIds.includes(group.id),
    })
  }

  return Array.from(merged.values()).sort((left, right) => {
    if (left.isStarred !== right.isStarred) {
      return left.isStarred ? -1 : 1
    }

    if (left.isArchived !== right.isArchived) {
      return left.isArchived ? 1 : -1
    }

    return toTimestamp(right.lastAccessedAt) - toTimestamp(left.lastAccessedAt)
  })
}

export function buildUserGroupMigrationPayload({
  storedGroups,
  recentGroups,
  starredGroupIds,
  archivedGroupIds,
  now,
}: UserGroupSyncState): StoredUserGroup[] {
  const storedGroupIds = new Set(storedGroups.map((group) => group.groupId))

  return recentGroups
    .filter((group) => !storedGroupIds.has(group.id))
    .map((group) => ({
      groupId: group.id,
      groupName: group.name,
      lastAccessedAt: (now ?? new Date()).toISOString(),
      isArchived: archivedGroupIds.includes(group.id),
      isStarred: starredGroupIds.includes(group.id),
    }))
}
