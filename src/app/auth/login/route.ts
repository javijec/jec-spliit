import { auth } from '@/lib/better-auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
const DEFAULT_RETURN_TO = '/groups'

export function getSafeReturnTo(request: NextRequest) {
  const candidate =
    request.nextUrl.searchParams.get('returnTo') ??
    request.nextUrl.searchParams.get('callbackURL')

  if (!candidate || candidate.startsWith('//')) {
    return DEFAULT_RETURN_TO
  }

  try {
    const parsed = new URL(candidate, request.nextUrl.origin)
    if (parsed.origin !== request.nextUrl.origin) {
      return DEFAULT_RETURN_TO
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return DEFAULT_RETURN_TO
  }
}

export async function GET(request: NextRequest) {
  const returnTo = getSafeReturnTo(request)

  try {
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

    console.error('[auth] Google sign-in returned no authorization URL')
    return NextResponse.redirect(
      new URL('/?error=auth_start_failed', request.url),
      303,
    )
  } catch (error) {
    console.error(
      '[auth] Google sign-in start failed',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return NextResponse.redirect(
      new URL('/?error=auth_start_failed', request.url),
      303,
    )
  }
}
