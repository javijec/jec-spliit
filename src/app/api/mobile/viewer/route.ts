import { updateAppUserDisplayName } from '@/lib/auth'
import { requireMobileAppUser, MobileAuthError } from '@/lib/mobile-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAppUser(request)
    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Unexpected mobile auth error.' },
      { status: 500 },
    )
  }
}

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
})

export async function PUT(request: NextRequest) {
  try {
    const user = await requireMobileAppUser(request)
    const payload = await request.json()
    const parsed = updateProfileSchema.safeParse(payload)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid display name.', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const updatedUser = await updateAppUserDisplayName(
      user.id,
      parsed.data.displayName,
    )

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
      },
    })
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: 'Unexpected mobile profile error.' },
      { status: 500 },
    )
  }
}
