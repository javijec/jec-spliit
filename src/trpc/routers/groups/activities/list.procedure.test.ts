const getActivitiesMock = jest.fn()
const requireGroupMembershipMock = jest.fn()

jest.mock('@/lib/groups', () => ({
  getActivities: (...args: unknown[]) => getActivitiesMock(...args),
}))

jest.mock('../authorization', () => ({
  requireGroupMembership: (...args: unknown[]) =>
    requireGroupMembershipMock(...args),
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

import { TRPCError } from '@trpc/server'
import { groupsRouter } from '../index'

function createCaller(userId = 'user-1') {
  return groupsRouter.createCaller({
    auth: {
      session: { user: { sub: userId } },
      user: { id: userId },
    },
  } as never)
}

describe('groups.activities.list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireGroupMembershipMock.mockResolvedValue({
      groupId: 'group-1',
      role: 'MEMBER',
    })
  })

  it('lists a bounded newest-first page for a group member', async () => {
    const activities = Array.from({ length: 7 }, (_, index) => ({
      id: `activity-${index}`,
    }))
    getActivitiesMock.mockResolvedValue(activities)

    await expect(
      createCaller().activities.list({
        groupId: 'group-1',
        cursor: 0,
        limit: 6,
      }),
    ).resolves.toEqual({
      activities: activities.slice(0, 6),
      hasMore: true,
      nextCursor: 6,
    })

    expect(requireGroupMembershipMock).toHaveBeenCalledWith('user-1', 'group-1')
    expect(getActivitiesMock).toHaveBeenCalledWith('group-1', {
      offset: 0,
      length: 7,
    })
  })

  it('rejects non-members before reading activity data', async () => {
    requireGroupMembershipMock.mockRejectedValue(
      new TRPCError({ code: 'FORBIDDEN' }),
    )

    await expect(
      createCaller('outsider').activities.list({ groupId: 'group-1' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(getActivitiesMock).not.toHaveBeenCalled()
  })
})
