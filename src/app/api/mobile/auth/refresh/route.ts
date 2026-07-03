import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { MobileAuthError } from '@/lib/mobile-auth'
import { refreshMobileSession } from '@/lib/mobile-session'
import { toMobileAuthResponse } from '@/lib/mobile-auth-response'

export const runtime = 'nodejs'

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const payload = refreshSchema.parse(await request.json())
    const refreshed = await refreshMobileSession(payload.refreshToken)

    if (!refreshed) {
      throw new MobileAuthError('Mobile session expired.', 401)
    }

    return NextResponse.json(
      toMobileAuthResponse(refreshed.session.user, refreshed.tokens),
    )
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid mobile refresh payload.', issues: error.flatten() },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Unexpected mobile refresh error.' },
      { status: 500 },
    )
  }
}
