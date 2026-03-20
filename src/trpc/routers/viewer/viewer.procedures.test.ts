const getCurrentAuthSessionMock = jest.fn()
const getCurrentAppUserMock = jest.fn()

jest.mock('@/lib/auth', () => ({
  getCurrentAuthSession: (...args: unknown[]) => getCurrentAuthSessionMock(...args),
  getCurrentAppUser: (...args: unknown[]) => getCurrentAppUserMock(...args),
}))

jest.mock('superjson', () => ({
  __esModule: true,
  default: {
    registerCustom: jest.fn(),
  },
}))

import { viewerRouter } from './index'

function createCaller(userId?: string) {
  return viewerRouter.createCaller({
    auth: {
      session: userId ? ({ user: { sub: userId } } as never) : null,
      user: userId ? ({ id: userId, displayName: 'Javier' } as never) : null,
    },
  } as never)
}

describe('viewer tRPC procedures', () => {
  it('returns the authenticated app user in the viewer payload', async () => {
    const caller = createCaller('user-1')

    await expect(caller.getCurrent()).resolves.toEqual({
      user: { id: 'user-1', displayName: 'Javier' },
    })
  })

  it('returns null when there is no authenticated user', async () => {
    const caller = createCaller()

    await expect(caller.getCurrent()).resolves.toEqual({
      user: null,
    })
  })
})
