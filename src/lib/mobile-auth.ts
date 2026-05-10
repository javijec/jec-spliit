import { auth0Enabled, env } from '@/lib/env'
import { AuthenticatedUser, upsertAppUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

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

async function getAuthUserFromAccessToken(
  accessToken: string,
): Promise<AuthenticatedUser | null> {
  if (!auth0Enabled || !env.AUTH0_DOMAIN) {
    throw new MobileAuthError('Auth0 is not configured.', 503)
  }

  const response = await fetch(`https://${env.AUTH0_DOMAIN}/userinfo`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new MobileAuthError('Invalid access token.', 401)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const auth0UserId =
    typeof payload.sub === 'string' ? payload.sub : undefined

  if (!auth0UserId) {
    return null
  }

  return {
    auth0UserId,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    displayName: typeof payload.name === 'string' ? payload.name : undefined,
    avatarUrl: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}

export async function requireMobileAppUser(request: NextRequest) {
  const accessToken = getBearerToken(request)
  const authUser = await getAuthUserFromAccessToken(accessToken)

  if (!authUser) {
    throw new MobileAuthError('Authenticated user not found.', 401)
  }

  return upsertAppUser(authUser)
}
