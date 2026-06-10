import { auth } from '@/lib/better-auth'
import { prisma } from '@/lib/prisma'
import { randomId } from '@/lib/ids'
import { getUniqueParticipantName } from '@/lib/participants'
import { headers } from 'next/headers'

export interface AuthenticatedUser {
  auth0UserId: string
  email?: string
  displayName?: string
  avatarUrl?: string
}

export async function getCurrentAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function getCurrentAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentAuthSession()
  if (!session?.user.id) return null

  return {
    auth0UserId: `better-auth:${session.user.id}`,
    email:
      typeof session.user.email === 'string' ? session.user.email : undefined,
    displayName:
      typeof session.user.name === 'string' ? session.user.name : undefined,
    avatarUrl:
      typeof session.user.image === 'string' ? session.user.image : undefined,
  }
}

export async function upsertAppUser(authUser: AuthenticatedUser) {
  const existingByEmail = authUser.email
    ? await prisma.appUser.findUnique({ where: { email: authUser.email } })
    : null

  if (existingByEmail) {
    return prisma.appUser.update({
      where: { id: existingByEmail.id },
      data: {
        auth0UserId: authUser.auth0UserId,
        avatarUrl: authUser.avatarUrl,
        lastLoginAt: new Date(),
        ...(authUser.displayName ? { displayName: authUser.displayName } : {}),
      },
    })
  }

  return prisma.appUser.upsert({
    where: { auth0UserId: authUser.auth0UserId },
    create: {
      id: randomId(),
      auth0UserId: authUser.auth0UserId,
      email: authUser.email,
      displayName: authUser.displayName,
      avatarUrl: authUser.avatarUrl,
      lastLoginAt: new Date(),
    },
    update: {
      email: authUser.email,
      avatarUrl: authUser.avatarUrl,
      lastLoginAt: new Date(),
      ...(authUser.displayName ? { displayName: authUser.displayName } : {}),
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
