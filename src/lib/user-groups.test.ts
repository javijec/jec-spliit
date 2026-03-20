import {
  buildUserGroupMigrationPayload,
  mergeUserGroups,
  StoredUserGroup,
} from './user-groups'

describe('mergeUserGroups', () => {
  const now = new Date('2026-03-20T10:00:00.000Z')

  it('keeps persisted groups even when local storage is empty', () => {
    const storedGroups: StoredUserGroup[] = [
      {
        groupId: 'trip',
        groupName: 'Viaje a Bariloche',
        lastAccessedAt: '2026-03-19T09:00:00.000Z',
        isArchived: false,
        isStarred: true,
      },
    ]

    expect(
      mergeUserGroups({
        storedGroups,
        recentGroups: [],
        starredGroupIds: [],
        archivedGroupIds: [],
        now,
      }),
    ).toEqual(storedGroups)
  })

  it('imports legacy local groups that do not exist yet for the user', () => {
    expect(
      mergeUserGroups({
        storedGroups: [],
        recentGroups: [
          { id: 'home', name: 'Casa' },
          { id: 'office', name: 'Oficina' },
        ],
        starredGroupIds: ['home'],
        archivedGroupIds: ['office'],
        now,
      }),
    ).toEqual([
      {
        groupId: 'home',
        groupName: 'Casa',
        lastAccessedAt: now.toISOString(),
        isArchived: false,
        isStarred: true,
      },
      {
        groupId: 'office',
        groupName: 'Oficina',
        lastAccessedAt: now.toISOString(),
        isArchived: true,
        isStarred: false,
      },
    ])
  })

  it('prefers persisted metadata when the group already belongs to the user', () => {
    expect(
      mergeUserGroups({
        storedGroups: [
          {
            groupId: 'group-1',
            groupName: 'Nombre persistido',
            lastAccessedAt: '2026-03-18T08:00:00.000Z',
            isArchived: false,
            isStarred: false,
          },
        ],
        recentGroups: [{ id: 'group-1', name: 'Nombre local' }],
        starredGroupIds: ['group-1'],
        archivedGroupIds: ['group-1'],
        now,
      }),
    ).toEqual([
      {
        groupId: 'group-1',
        groupName: 'Nombre persistido',
        lastAccessedAt: '2026-03-18T08:00:00.000Z',
        isArchived: false,
        isStarred: false,
      },
    ])
  })

  it('sorts groups with starred first, then active, then archived', () => {
    expect(
      mergeUserGroups({
        storedGroups: [
          {
            groupId: 'archived',
            groupName: 'Archivado',
            lastAccessedAt: '2026-03-20T09:00:00.000Z',
            isArchived: true,
            isStarred: false,
          },
          {
            groupId: 'recent',
            groupName: 'Reciente',
            lastAccessedAt: '2026-03-20T08:00:00.000Z',
            isArchived: false,
            isStarred: false,
          },
          {
            groupId: 'starred',
            groupName: 'Favorito',
            lastAccessedAt: '2026-03-20T07:00:00.000Z',
            isArchived: false,
            isStarred: true,
          },
        ],
        recentGroups: [],
        starredGroupIds: [],
        archivedGroupIds: [],
        now,
      }).map((group) => group.groupId),
    ).toEqual(['starred', 'recent', 'archived'])
  })
})

describe('buildUserGroupMigrationPayload', () => {
  const now = new Date('2026-03-20T10:00:00.000Z')

  it('creates a migration payload only for legacy groups missing in persisted storage', () => {
    expect(
      buildUserGroupMigrationPayload({
        storedGroups: [
          {
            groupId: 'existing',
            groupName: 'Persistido',
            lastAccessedAt: '2026-03-18T08:00:00.000Z',
            isArchived: false,
            isStarred: false,
          },
        ],
        recentGroups: [
          { id: 'existing', name: 'Persistido local' },
          { id: 'new', name: 'Nuevo grupo' },
        ],
        starredGroupIds: ['new'],
        archivedGroupIds: [],
        now,
      }),
    ).toEqual([
      {
        groupId: 'new',
        groupName: 'Nuevo grupo',
        lastAccessedAt: now.toISOString(),
        isArchived: false,
        isStarred: true,
      },
    ])
  })
})
