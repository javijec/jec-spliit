import { auth0 } from '@/lib/auth0'
import { prisma } from '@/lib/prisma'
import { randomId } from '@/lib/ids'

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
  const [user] = await prisma.$transaction([
    prisma.appUser.update({
      where: { id: userId },
      data: { displayName },
    }),
    prisma.participant.updateMany({
      where: { appUserId: userId },
      data: { name: displayName },
    }),
  ])

  return user
}
