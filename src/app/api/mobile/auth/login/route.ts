import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { upsertAppUser } from '@/lib/auth'
import { env } from '@/lib/env'
import {
  getAuthUserFromGoogleIdToken,
  MobileAuthError,
} from '@/lib/mobile-auth'
import { createMobileSession } from '@/lib/mobile-session'
import { toMobileAuthResponse } from '@/lib/mobile-auth-response'

export const runtime = 'nodejs'

const loginSchema = z.object({
  idToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    if (!env.GOOGLE_ANDROID_CLIENT_ID && !env.GOOGLE_CLIENT_ID) {
      throw new MobileAuthError('Mobile auth is not configured.', 503)
    }

    const payload = loginSchema.parse(await request.json())
    const authUser = await getAuthUserFromGoogleIdToken(payload.idToken)

    if (!authUser) {
      throw new MobileAuthError('Authenticated user not found.', 401)
    }

    const user = await upsertAppUser(authUser)
    const session = await createMobileSession(user.id)

    return NextResponse.json(toMobileAuthResponse(user, session.tokens))
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid mobile login payload.', issues: error.flatten() },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Unexpected mobile login error.' },
      { status: 500 },
    )
  }
}
