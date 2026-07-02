import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { MobileAuthError, requireMobileAppUser } from '@/lib/mobile-auth'
import {
  deleteMobilePushToken,
  registerMobilePushToken,
} from '@/lib/push-notifications'

export const runtime = 'nodejs'

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.string().min(1).default('android'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAppUser(request)
    const payload = pushTokenSchema.parse(await request.json())

    await registerMobilePushToken({
      userId: user.id,
      token: payload.token,
      platform: payload.platform,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Failed to register push token.' },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireMobileAppUser(request)
    const payload = pushTokenSchema.pick({ token: true }).parse(await request.json())

    await deleteMobilePushToken(payload.token)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Failed to delete push token.' },
      { status: 400 },
    )
  }
}
