import { TRPCError } from '@trpc/server'

const getGroupMock = jest.fn()
const getGroupAccessControlMock = jest.fn()
const getGroupExpensesParticipantsMock = jest.fn()
const getUserGroupMembershipMock = jest.fn()

jest.mock('@/lib/groups', () => ({
  getGroup: (...args: unknown[]) => getGroupMock(...args),
  getGroupAccessControl: (...args: unknown[]) => getGroupAccessControlMock(...args),
}))

jest.mock('@/lib/expenses', () => ({
  getGroupExpensesParticipants: (...args: unknown[]) => getGroupExpensesParticipantsMock(...args),
}))

jest.mock('@/lib/user-memberships', () => ({
  getUserGroupMembership: (...args: unknown[]) => getUserGroupMembershipMock(...args),
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
      user: userId ? ({ id: userId } as never) : null,
    },
  } as never)
}

describe('groups read tRPC procedures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the group plus the persisted active participant for authenticated users', async () => {
    getGroupMock.mockResolvedValue({
      id: 'group-1',
      name: 'Viaje',
      participants: [{ id: 'participant-1', name: 'Juan' }],
    })
    getUserGroupMembershipMock.mockResolvedValue({
      groupId: 'group-1',
      activeParticipantId: 'participant-1',
    })

    const caller = createCaller('user-1')
    const result = await caller.get({ groupId: 'group-1' })

    expect(getGroupMock).toHaveBeenCalledWith('group-1')
    expect(getUserGroupMembershipMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(result).toEqual({
      group: {
        id: 'group-1',
        name: 'Viaje',
        participants: [{ id: 'participant-1', name: 'Juan' }],
      },
      currentActiveParticipantId: 'participant-1',
    })
  })

  it('returns null active participant when the request is anonymous', async () => {
    getGroupMock.mockResolvedValue({
      id: 'group-1',
      name: 'Viaje',
      participants: [],
    })

    const caller = createCaller()
    const result = await caller.get({ groupId: 'group-1' })

    expect(getUserGroupMembershipMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      group: {
        id: 'group-1',
        name: 'Viaje',
        participants: [],
      },
      currentActiveParticipantId: null,
    })
  })

  it('returns details including access control, participants with expenses and active participant', async () => {
    getGroupMock.mockResolvedValue({
      id: 'group-1',
      name: 'Viaje',
      participants: [{ id: 'participant-1', name: 'Juan' }],
    })
    getGroupExpensesParticipantsMock.mockResolvedValue(['participant-1'])
    getGroupAccessControlMock.mockResolvedValue({
      hasAccessPassword: true,
    })
    getUserGroupMembershipMock.mockResolvedValue({
      groupId: 'group-1',
      activeParticipantId: 'participant-1',
    })

    const caller = createCaller('user-1')
    const result = await caller.getDetails({ groupId: 'group-1' })

    expect(getGroupExpensesParticipantsMock).toHaveBeenCalledWith('group-1')
    expect(getGroupAccessControlMock).toHaveBeenCalledWith('group-1')
    expect(result).toEqual({
      group: {
        id: 'group-1',
        name: 'Viaje',
        participants: [{ id: 'participant-1', name: 'Juan' }],
      },
      participantsWithExpenses: ['participant-1'],
      hasAccessPassword: true,
      currentActiveParticipantId: 'participant-1',
    })
  })

  it('throws not found when the group does not exist', async () => {
    getGroupMock.mockResolvedValue(null)

    const caller = createCaller('user-1')

    await expect(caller.getDetails({ groupId: 'missing' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Group not found.',
    } satisfies Partial<TRPCError>)
  })
})
