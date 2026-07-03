import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { MobileAuthError } from '@/lib/mobile-auth'
import {
  revokeMobileSessionByAccessToken,
  revokeMobileSessionByRefreshToken,
} from '@/lib/mobile-session'

export const runtime = 'nodejs'

const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const payload = logoutSchema.parse(await request.json().catch(() => ({})))
    const bearerToken = request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')?.slice('Bearer '.length).trim()
      : null

    const revoked = payload.refreshToken
      ? await revokeMobileSessionByRefreshToken(payload.refreshToken)
      : bearerToken
        ? await revokeMobileSessionByAccessToken(bearerToken)
        : false

    if (!revoked) {
      throw new MobileAuthError('Mobile session not found.', 401)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid mobile logout payload.', issues: error.flatten() },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: 'Unexpected mobile logout error.' },
      { status: 500 },
    )
  }
}
