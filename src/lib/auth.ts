import { auth0 } from '@/lib/auth0'
import { prisma } from '@/lib/prisma'
import { randomId } from '@/lib/ids'
import { getUniqueParticipantName } from '@/lib/participants'

export interface AuthenticatedUser {
  auth0UserId: string
  email?: string
  displayName?: string
  avatarUrl?: string
}

export async function getCurrentAuthSession() {
  if (!auth0) return null
  return auth0.getSession()
}

export async function getCurrentAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentAuthSession()
  if (!session?.user.sub) return null

  return {
    auth0UserId: session.user.sub,
    email:
      typeof session.user.email === 'string' ? session.user.email : undefined,
    displayName:
      typeof session.user.name === 'string' ? session.user.name : undefined,
    avatarUrl:
      typeof session.user.picture === 'string'
        ? session.user.picture
        : undefined,
  }
}

export async function upsertAppUser(authUser: AuthenticatedUser) {
  const existingUser = await prisma.appUser.findUnique({
    where: { auth0UserId: authUser.auth0UserId },
    select: { id: true, displayName: true },
  })

  if (!existingUser) {
    return prisma.appUser.create({
      data: {
        id: randomId(),
        auth0UserId: authUser.auth0UserId,
        email: authUser.email,
        displayName: authUser.displayName,
        avatarUrl: authUser.avatarUrl,
        lastLoginAt: new Date(),
      },
    })
  }

  return prisma.appUser.update({
    where: { id: existingUser.id },
    data: {
      email: authUser.email,
      displayName: existingUser.displayName ?? authUser.displayName,
      avatarUrl: authUser.avatarUrl,
      lastLoginAt: new Date(),
    },
  })
}

export async function getCurrentAppUser() {
  const authUser = await getCurrentAuthUser()
  if (!authUser) return null
  return upsertAppUser(authUser)
}

export async function updateAppUserDisplayName(
  userId: string,
  displayName: string,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.appUser.update({
      where: { id: userId },
      data: { displayName },
    })

    const linkedParticipants = await tx.participant.findMany({
      where: { appUserId: userId },
      select: { id: true, groupId: true },
      orderBy: [{ groupId: 'asc' }, { id: 'asc' }],
    })

    for (const participant of linkedParticipants) {
      const uniqueName = await getUniqueParticipantName(
        tx,
        participant.groupId,
        participant.id,
        displayName,
      )

      await tx.participant.update({
        where: { id: participant.id },
        data: { name: uniqueName },
      })
    }

    return user
  })
}

export async function deleteAppUserAccount(userId: string) {
  return prisma.appUser.delete({
    where: { id: userId },
  })
}
