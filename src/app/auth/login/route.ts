import { auth } from '@/lib/better-auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const returnTo =
    request.nextUrl.searchParams.get('returnTo') ??
    request.nextUrl.searchParams.get('callbackURL') ??
    '/groups'

  const result = await auth.api.signInSocial({
    body: {
      provider: 'google',
      callbackURL: returnTo,
    },
    headers: request.headers,
  })

  if (result.url) {
    return NextResponse.redirect(result.url)
  }

  return NextResponse.redirect(new URL(returnTo, request.url))
}
