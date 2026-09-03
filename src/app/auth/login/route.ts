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
    returnHeaders: true,
  })

  if (result.response.url) {
    const response = NextResponse.redirect(result.response.url)
    const headers = result.headers as Headers & {
      getSetCookie?: () => string[]
    }
    const setCookieHeaders =
      headers.getSetCookie?.() ??
      (headers.get('set-cookie') ? [headers.get('set-cookie') as string] : [])

    for (const cookie of setCookieHeaders) {
      response.headers.append('set-cookie', cookie)
    }

    return response
  }

  return NextResponse.redirect(new URL(returnTo, request.url))
}
