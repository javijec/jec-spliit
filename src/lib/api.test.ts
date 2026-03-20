import { GroupRole } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    participant: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    userGroupMembership: {
      upsert: jest.fn(),
    },
  },
}))

jest.mock('nanoid', () => ({
  nanoid: jest.fn(),
}))

import { createGroup, setUserActiveParticipant } from './api'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import type { GroupFormValues } from './schemas'

const transactionMock = jest.mocked(prisma.$transaction)
const participantFindFirstMock = jest.mocked(prisma.participant.findFirst)
const participantUpdateMock = jest.mocked(prisma.participant.update)
const participantUpdateManyMock = jest.mocked(prisma.participant.updateMany)
const membershipUpsertMock = jest.mocked(prisma.userGroupMembership.upsert)
const nanoidMock = jest.mocked(nanoid)

const mockTx = {
  group: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  userGroupMembership: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
}

const baseGroupFormValues: GroupFormValues = {
  name: 'Viaje',
  information: 'Vacaciones',
  currency: '$',
  currencyCode: 'USD',
  participants: [{ name: 'Juan' }, { name: 'Maria' }, { name: 'Sergio' }],
}

describe('createGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    transactionMock.mockImplementation(async (input) => {
      if (typeof input === 'function') {
        return input(mockTx as never)
      }
      return Promise.all(input)
    })
  })

  it('creates the group first and then saves the owner membership with the active participant', async () => {
    nanoidMock
      .mockReturnValueOnce('group-id')
      .mockReturnValueOnce('participant-juan')
      .mockReturnValueOnce('participant-maria')
      .mockReturnValueOnce('participant-sergio')
      .mockReturnValueOnce('membership-id')

    mockTx.group.create.mockResolvedValue(undefined)
    mockTx.userGroupMembership.create.mockResolvedValue(undefined)
    mockTx.group.findUnique.mockResolvedValue({
      id: 'group-id',
      participants: [
        { id: 'participant-juan', name: 'Juan' },
        { id: 'participant-maria', name: 'Maria' },
        { id: 'participant-sergio', name: 'Sergio' },
      ],
    })

    const group = await createGroup(baseGroupFormValues, {
      userId: 'user-1',
      activeParticipantName: 'Juan',
    })

    expect(mockTx.group.create).toHaveBeenCalledWith({
      data: {
        id: 'group-id',
        name: 'Viaje',
        information: 'Vacaciones',
        currency: '$',
        currencyCode: 'USD',
        participants: {
          createMany: {
            data: [
              {
                id: 'participant-juan',
                name: 'Juan',
                appUserId: 'user-1',
              },
              {
                id: 'participant-maria',
                name: 'Maria',
                appUserId: undefined,
              },
              {
                id: 'participant-sergio',
                name: 'Sergio',
                appUserId: undefined,
              },
            ],
          },
        },
      },
    })
    expect(mockTx.userGroupMembership.create).toHaveBeenCalledWith({
      data: {
        id: 'membership-id',
        userId: 'user-1',
        groupId: 'group-id',
        role: GroupRole.OWNER,
        activeParticipantId: 'participant-juan',
        lastAccessedAt: expect.any(Date),
      },
    })
    expect(mockTx.group.findUnique).toHaveBeenCalledWith({
      where: { id: 'group-id' },
      include: { participants: true },
    })
    expect(group).toEqual({
      id: 'group-id',
      participants: [
        { id: 'participant-juan', name: 'Juan' },
        { id: 'participant-maria', name: 'Maria' },
        { id: 'participant-sergio', name: 'Sergio' },
      ],
    })
  })

  it('creates groups without memberships for guests', async () => {
    nanoidMock
      .mockReturnValueOnce('group-id')
      .mockReturnValueOnce('participant-juan')
      .mockReturnValueOnce('participant-maria')
      .mockReturnValueOnce('participant-sergio')

    mockTx.group.create.mockResolvedValue(undefined)
    mockTx.group.findUnique.mockResolvedValue({
      id: 'group-id',
      participants: [{ id: 'participant-juan', name: 'Juan' }],
    })

    await createGroup(baseGroupFormValues)

    expect(mockTx.userGroupMembership.create).not.toHaveBeenCalled()
    expect(mockTx.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participants: {
            createMany: {
              data: expect.arrayContaining([
                expect.objectContaining({
                  id: 'participant-juan',
                  name: 'Juan',
                  appUserId: undefined,
                }),
              ]),
            },
          },
        }),
      }),
    )
  })
})

describe('setUserActiveParticipant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    transactionMock.mockImplementation(async (input) => {
      if (typeof input === 'function') {
        return input(mockTx as never)
      }
      return Promise.all(input)
    })
    participantUpdateManyMock.mockResolvedValue({ count: 1 } as never)
    participantUpdateMock.mockResolvedValue({} as never)
    membershipUpsertMock.mockResolvedValue({} as never)
  })

  it('persists the selected participant for the authenticated user', async () => {
    nanoidMock.mockReturnValueOnce('membership-id')
    participantFindFirstMock.mockResolvedValue({ id: 'participant-juan' } as never)

    await setUserActiveParticipant('user-1', 'group-1', 'participant-juan')

    expect(participantFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: 'participant-juan',
        groupId: 'group-1',
      },
      select: { id: true },
    })
    expect(participantUpdateManyMock).toHaveBeenCalledWith({
      where: {
        groupId: 'group-1',
        appUserId: 'user-1',
        id: { not: 'participant-juan' },
      },
      data: {
        appUserId: null,
      },
    })
    expect(participantUpdateMock).toHaveBeenCalledWith({
      where: { id: 'participant-juan' },
      data: { appUserId: 'user-1' },
    })
    expect(membershipUpsertMock).toHaveBeenCalledWith({
      where: {
        userId_groupId: {
          userId: 'user-1',
          groupId: 'group-1',
        },
      },
      create: {
        id: 'membership-id',
        userId: 'user-1',
        groupId: 'group-1',
        role: GroupRole.MEMBER,
        activeParticipantId: 'participant-juan',
        lastAccessedAt: expect.any(Date),
      },
      update: {
        activeParticipantId: 'participant-juan',
        lastAccessedAt: expect.any(Date),
      },
    })
  })

  it('clears the persisted participant when the user selects none', async () => {
    nanoidMock.mockReturnValueOnce('membership-id')

    await setUserActiveParticipant('user-1', 'group-1', null)

    expect(participantUpdateManyMock).toHaveBeenCalledWith({
      where: {
        groupId: 'group-1',
        appUserId: 'user-1',
      },
      data: {
        appUserId: null,
      },
    })
    expect(membershipUpsertMock).toHaveBeenCalledWith({
      where: {
        userId_groupId: {
          userId: 'user-1',
          groupId: 'group-1',
        },
      },
      create: {
        id: 'membership-id',
        userId: 'user-1',
        groupId: 'group-1',
        role: GroupRole.MEMBER,
        activeParticipantId: null,
        lastAccessedAt: expect.any(Date),
      },
      update: {
        activeParticipantId: null,
        lastAccessedAt: expect.any(Date),
      },
    })
    expect(participantUpdateMock).not.toHaveBeenCalled()
  })

  it('rejects participants that do not belong to the group', async () => {
    participantFindFirstMock.mockResolvedValue(null)

    await expect(
      setUserActiveParticipant('user-1', 'group-1', 'participant-juan'),
    ).rejects.toThrow('Invalid participant ID: participant-juan')

    expect(participantUpdateManyMock).not.toHaveBeenCalled()
    expect(membershipUpsertMock).not.toHaveBeenCalled()
  })
})
