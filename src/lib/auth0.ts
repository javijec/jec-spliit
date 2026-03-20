import { auth0Enabled, env } from '@/lib/env'
import { Auth0Client } from '@auth0/nextjs-auth0/server'

export const auth0 = auth0Enabled
  ? new Auth0Client({
      appBaseUrl: env.APP_BASE_URL,
      authorizationParameters: {
        scope: 'openid profile email',
      },
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      domain: env.AUTH0_DOMAIN,
      secret: env.AUTH0_SECRET,
    })
  : null
