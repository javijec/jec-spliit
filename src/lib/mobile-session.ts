import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

import { AppUser, MobileSession } from '@prisma/client'

import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { randomId } from '@/lib/ids'

export const MOBILE_SESSION_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
export const MOBILE_SESSION_REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface MobileAuthSessionTokens {
  accessToken: string
  accessTokenExpiresAtMillis: number
  refreshToken: string
  refreshTokenExpiresAtMillis: number
}

interface MobileAccessTokenClaims {
  typ: 'mobile-access'
  sid: string
  sub: string
  iat: number
  exp: number
}

function toBase64UrlJson(value: object) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function fromBase64UrlJson<T>(value: string): T | null {
  return runCatchingJson<T>(() => {
    const parsed = Buffer.from(value, 'base64url').toString('utf8')
    return JSON.parse(parsed) as T
  })
}

function runCatchingJson<T>(handler: () => T): T | null {
  try {
    return handler()
  } catch {
    return null
  }
}

function hashRefreshToken(refreshToken: string) {
  return createHmac('sha256', env.MOBILE_SESSION_SECRET)
    .update(refreshToken)
    .digest('hex')
}

function issueMobileAccessToken(input: {
  sessionId: string
  userId: string
  expiresAt: Date
}): string {
  const header = toBase64UrlJson({ alg: 'HS256', typ: 'JWT' })
  const payload = toBase64UrlJson({
    typ: 'mobile-access',
    sid: input.sessionId,
    sub: input.userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(input.expiresAt.getTime() / 1000),
  } satisfies MobileAccessTokenClaims)

  const signature = createHmac('sha256', env.MOBILE_SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

function verifyMobileAccessToken(accessToken: string): MobileAccessTokenClaims | null {
  try {
    const [headerPart, payloadPart, signaturePart] = accessToken.split('.')
    if (!headerPart || !payloadPart || !signaturePart) return null

    const expectedSignature = createHmac('sha256', env.MOBILE_SESSION_SECRET)
      .update(`${headerPart}.${payloadPart}`)
      .digest()
    const providedSignature = Buffer.from(signaturePart, 'base64url')

    if (
      expectedSignature.length !== providedSignature.length ||
      !timingSafeEqual(
        new Uint8Array(expectedSignature),
        new Uint8Array(providedSignature),
      )
    ) {
      return null
    }

    const payload = fromBase64UrlJson<MobileAccessTokenClaims>(payloadPart)
    if (!payload || payload.typ !== 'mobile-access') return null

    const nowSeconds = Math.floor(Date.now() / 1000)
    if (payload.exp <= nowSeconds) return null

    return payload
  } catch {
    return null
  }
}

async function getMobileSessionRecordById(sessionId: string) {
  return prisma.mobileSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
    },
  })
}

function isMobileSessionActive(session: MobileSession) {
  const now = new Date()
  return !session.revokedAt && session.refreshTokenExpiresAt > now
}

export async function createMobileSession(userId: string) {
  const now = new Date()
  const refreshToken = randomBytes(32).toString('base64url')
  const refreshTokenExpiresAt = new Date(
    now.getTime() + MOBILE_SESSION_REFRESH_TOKEN_TTL_MS,
  )
  const accessTokenExpiresAt = new Date(
    now.getTime() + MOBILE_SESSION_ACCESS_TOKEN_TTL_MS,
  )

  const session = await prisma.mobileSession.create({
    data: {
      id: randomId(),
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      refreshTokenExpiresAt,
      accessTokenExpiresAt,
      lastSeenAt: now,
    },
  })

  return {
    session,
    tokens: {
      accessToken: issueMobileAccessToken({
        sessionId: session.id,
        userId: session.userId,
        expiresAt: accessTokenExpiresAt,
      }),
      accessTokenExpiresAtMillis: accessTokenExpiresAt.getTime(),
      refreshToken,
      refreshTokenExpiresAtMillis: refreshTokenExpiresAt.getTime(),
    } satisfies MobileAuthSessionTokens,
  }
}

export async function authenticateMobileAccessToken(accessToken: string) {
  const claims = verifyMobileAccessToken(accessToken)
  if (!claims) return null

  const session = await getMobileSessionRecordById(claims.sid)
  if (!session || !isMobileSessionActive(session) || session.userId !== claims.sub) {
    return null
  }

  await prisma.mobileSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  })

  return session.user
}

export async function refreshMobileSession(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash },
    include: { user: true },
  })

  if (!session || !isMobileSessionActive(session)) {
    return null
  }

  const updatedAccessTokenExpiresAt = new Date(
    Date.now() + MOBILE_SESSION_ACCESS_TOKEN_TTL_MS,
  )

  const updatedSession = await prisma.mobileSession.update({
    where: { id: session.id },
    data: {
      accessTokenExpiresAt: updatedAccessTokenExpiresAt,
      lastSeenAt: new Date(),
    },
    include: { user: true },
  })

  return {
    session: updatedSession,
    tokens: {
      accessToken: issueMobileAccessToken({
        sessionId: updatedSession.id,
        userId: updatedSession.userId,
        expiresAt: updatedAccessTokenExpiresAt,
      }),
      accessTokenExpiresAtMillis: updatedAccessTokenExpiresAt.getTime(),
      refreshToken,
      refreshTokenExpiresAtMillis: updatedSession.refreshTokenExpiresAt.getTime(),
    } satisfies MobileAuthSessionTokens,
  }
}

export async function revokeMobileSessionByRefreshToken(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash },
  })

  if (!session) return false

  await prisma.mobileSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  })

  return true
}

export async function revokeMobileSessionByAccessToken(accessToken: string) {
  const claims = verifyMobileAccessToken(accessToken)
  if (!claims) return false

  const session = await prisma.mobileSession.findUnique({
    where: { id: claims.sid },
  })

  if (!session) return false

  await prisma.mobileSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  })

  return true
}

export async function getMobileUserFromAccessToken(accessToken: string) {
  const user = await authenticateMobileAccessToken(accessToken)
  return user
}
