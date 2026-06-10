import { env } from '@/lib/env'
import { AuthenticatedUser, upsertAppUser } from '@/lib/auth'
import { NextRequest } from 'next/server'
import { OAuth2Client } from 'google-auth-library'

export class MobileAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    throw new MobileAuthError('Missing bearer token.', 401)
  }

  return authorization.slice('Bearer '.length).trim()
}

const googleClient = new OAuth2Client()

async function getAuthUserFromGoogleIdToken(
  idToken: string,
): Promise<AuthenticatedUser | null> {
  const audiences = [
    env.GOOGLE_ANDROID_CLIENT_ID,
    env.GOOGLE_CLIENT_ID,
  ].filter((value): value is string => Boolean(value))

  if (audiences.length === 0) {
    throw new MobileAuthError('Google auth is not configured.', 503)
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: audiences,
  })

  const payload = ticket.getPayload()
  const googleUserId = payload?.sub

  if (!googleUserId) {
    return null
  }

  return {
    auth0UserId: `google:${googleUserId}`,
    email: payload.email,
    displayName: payload.name,
    avatarUrl: payload.picture,
  }
}

export async function requireMobileAppUser(request: NextRequest) {
  const idToken = getBearerToken(request)
  const authUser = await getAuthUserFromGoogleIdToken(idToken)

  if (!authUser) {
    throw new MobileAuthError('Authenticated user not found.', 401)
  }

  return upsertAppUser(authUser)
}
