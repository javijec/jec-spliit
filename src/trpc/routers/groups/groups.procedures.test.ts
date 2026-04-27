import { TRPCError } from '@trpc/server'

const createGroupMock = jest.fn()
const addGroupMemberMock = jest.fn()
const removeGroupMemberMock = jest.fn()
const getUserGroupsMock = jest.fn()
const recordVisitMock = jest.fn()
const setActiveParticipantMock = jest.fn()
const syncLegacyMock = jest.fn()
const updateMembershipMock = jest.fn()
const requireGroupOwnerMock = jest.fn()

jest.mock('@/lib/groups', () => ({
  createGroup: (...args: unknown[]) => createGroupMock(...args),
}))

jest.mock('@/lib/user-memberships', () => ({
  addUserToGroupByEmail: (...args: unknown[]) => addGroupMemberMock(...args),
  getUserGroups: (...args: unknown[]) => getUserGroupsMock(...args),
  removeUserFromGroup: (...args: unknown[]) => removeGroupMemberMock(...args),
  saveGroupToUser: (...args: unknown[]) => recordVisitMock(...args),
  setUserActiveParticipant: (...args: unknown[]) => setActiveParticipantMock(...args),
  syncUserGroupsFromLegacyState: (...args: unknown[]) => syncLegacyMock(...args),
  updateUserGroupMembership: (...args: unknown[]) => updateMembershipMock(...args),
}))

jest.mock('./authorization', () => ({
  requireGroupOwner: (...args: unknown[]) => requireGroupOwnerMock(...args),
  requireGroupMembership: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getCurrentAuthSession: jest.fn(),
  getCurrentAppUser: jest.fn(),
}))

jest.mock('superjson', () => ({
  __esModule: true,
  default: {
    registerCustom: jest.fn(),
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id'),
}))

import { groupsRouter } from './index'

function createCaller(userId?: string) {
  return groupsRouter.createCaller({
    auth: {
      session: userId ? ({ user: { sub: userId } } as never) : null,
      user: userId ? ({ id: userId, displayName: 'Javier' } as never) : null,
    },
  } as never)
}

describe('groups tRPC procedures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireGroupOwnerMock.mockResolvedValue({
      groupId: 'group-1',
      role: 'OWNER',
    })
  })

  it('creates groups with the authenticated user and active participant name', async () => {
    createGroupMock.mockResolvedValue({ id: 'group-1' })

    const caller = createCaller('user-1')
    const result = await caller.create({
      groupFormValues: {
        name: 'Viaje',
        information: 'Vacaciones',
        currency: '$',
        currencyCode: 'USD',
        participants: [{ name: 'Juan' }, { name: 'Maria' }],
      },
      activeParticipantName: 'Juan',
    })

    expect(createGroupMock).toHaveBeenCalledWith(
      {
        name: 'Viaje',
        information: 'Vacaciones',
        currency: '$',
        currencyCode: 'USD',
        participants: [{ name: 'Juan' }, { name: 'Maria' }],
      },
      {
        userId: 'user-1',
        activeParticipantName: 'Juan',
        linkedUserName: 'Javier',
      },
    )
    expect(result).toEqual({ groupId: 'group-1' })
  })

  it('lists only the authenticated user groups', async () => {
    getUserGroupsMock.mockResolvedValue([
      { id: 'group-1', name: 'Viaje', isStarred: true },
    ])

    const caller = createCaller('user-1')
    const result = await caller.mine()

    expect(getUserGroupsMock).toHaveBeenCalledWith('user-1')
    expect(result).toEqual({
      groups: [{ id: 'group-1', name: 'Viaje', isStarred: true }],
    })
  })

  it('migrates legacy groups into the authenticated user account', async () => {
    syncLegacyMock.mockResolvedValue({ importedCount: 2 })

    const caller = createCaller('user-1')
    const result = await caller.syncLegacy({
      recentGroups: [
        { id: 'group-1', name: 'Viaje' },
        { id: 'group-2', name: 'Casa' },
      ],
      starredGroupIds: ['group-1'],
      archivedGroupIds: ['group-2'],
    })

    expect(syncLegacyMock).toHaveBeenCalledWith('user-1', {
      recentGroups: [
        { id: 'group-1', name: 'Viaje' },
        { id: 'group-2', name: 'Casa' },
      ],
      starredGroupIds: ['group-1'],
      archivedGroupIds: ['group-2'],
    })
    expect(result).toEqual({ importedCount: 2 })
  })

  it('records visits and persists active participants for the authenticated user', async () => {
    recordVisitMock.mockResolvedValue({ id: 'group-1', name: 'Viaje' })
    setActiveParticipantMock.mockResolvedValue(undefined)
    updateMembershipMock.mockResolvedValue(undefined)

    const caller = createCaller('user-1')

    await expect(
      caller.recordVisit({
        groupId: 'group-1',
      }),
    ).resolves.toEqual({
      group: { id: 'group-1', name: 'Viaje' },
    })

    await expect(
      caller.setActiveParticipant({
        groupId: 'group-1',
        participantId: 'participant-1',
      }),
    ).resolves.toEqual({ success: true })

    await expect(
      caller.updateMembership({
        groupId: 'group-1',
        isStarred: true,
        isArchived: false,
      }),
    ).resolves.toEqual({ success: true })

    expect(recordVisitMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(setActiveParticipantMock).toHaveBeenCalledWith(
      'user-1',
      'group-1',
      'participant-1',
      'Javier',
    )
    expect(updateMembershipMock).toHaveBeenCalledWith('user-1', 'group-1', {
      isArchived: false,
      isStarred: true,
    })
  })

  it('adds an existing signed-in user to the group by email', async () => {
    addGroupMemberMock.mockResolvedValue({
      userId: 'user-2',
      email: 'invitee@example.com',
      participantId: 'participant-2',
      participantName: 'Maria',
    })

    const caller = createCaller('user-1')
    const result = await caller.addMember({
      groupId: 'group-1',
      participantId: 'participant-2',
      email: 'invitee@example.com',
    })

    expect(requireGroupOwnerMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(addGroupMemberMock).toHaveBeenCalledWith(
      'group-1',
      'participant-2',
      'invitee@example.com',
    )
    expect(result).toEqual({
      member: {
        userId: 'user-2',
        email: 'invitee@example.com',
        participantId: 'participant-2',
        participantName: 'Maria',
      },
    })
  })

  it('removes a non-owner member from the group', async () => {
    removeGroupMemberMock.mockResolvedValue({ success: true })

    const caller = createCaller('user-1')
    const result = await caller.removeMember({
      groupId: 'group-1',
      userId: 'user-2',
    })

    expect(requireGroupOwnerMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(removeGroupMemberMock).toHaveBeenCalledWith('group-1', 'user-2')
    expect(result).toEqual({ success: true })
  })

  it('rejects protected procedures when there is no authenticated user', async () => {
    const caller = createCaller()

    await expect(caller.mine()).rejects.toBeInstanceOf(TRPCError)
    await expect(caller.setActiveParticipant({
      groupId: 'group-1',
      participantId: 'participant-1',
    })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
