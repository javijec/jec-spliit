import { AppUser } from '@prisma/client'

import { MobileAuthSessionTokens } from '@/lib/mobile-session'

export function toMobileUserResponse(user: AppUser) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

export function toMobileAuthResponse(
  user: AppUser,
  session: MobileAuthSessionTokens,
) {
  return {
    user: toMobileUserResponse(user),
    session,
  }
}
