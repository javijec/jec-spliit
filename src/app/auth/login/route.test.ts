/** @jest-environment node */

import { auth } from '@/lib/better-auth'
import type { NextRequest } from 'next/server'
import { GET, getSafeReturnTo } from './route'

jest.mock('@/lib/better-auth', () => ({
  auth: {
    api: {
      signInSocial: jest.fn(),
    },
  },
}))

const signInSocial = auth.api.signInSocial as unknown as jest.Mock

function makeRequest(query = '') {
  const url = new URL(`https://jec-spliit.vercel.app/auth/login${query}`)

  return {
    nextUrl: url,
    headers: new Headers(),
    url: url.toString(),
  } as unknown as NextRequest
}

function makeResult(
  cookies: string[],
  url = 'https://accounts.google.com/oauth',
) {
  const headers = new Headers()
  for (const cookie of cookies) {
    headers.append('set-cookie', cookie)
  }

  Object.defineProperty(headers, 'getSetCookie', {
    value: () => cookies,
  })

  return {
    headers,
    response: {
      redirect: true,
      url,
    },
  }
}

describe('Google OAuth login route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts Google OAuth and preserves every Set-Cookie header', async () => {
    const cookies = [
      '__Secure-better-auth.state=state; Path=/; Secure; HttpOnly; SameSite=lax',
      'better-auth.pkce=verifier; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Path=/',
    ]
    signInSocial.mockResolvedValue(makeResult(cookies))

    const response = await GET(makeRequest('?connection=google-oauth2'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://accounts.google.com/oauth',
    )
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining(cookies[0]),
    )
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining(cookies[1]),
    )
    expect(signInSocial).toHaveBeenCalledWith({
      body: {
        provider: 'google',
        callbackURL: '/groups',
      },
      headers: expect.any(Headers),
      returnHeaders: true,
    })
  })

  it('accepts internal return paths and rejects external destinations', () => {
    expect(getSafeReturnTo(makeRequest('?returnTo=%2Finvite%2Fabc'))).toBe(
      '/invite/abc',
    )
    expect(
      getSafeReturnTo(makeRequest('?returnTo=https%3A%2F%2Fevil.example')),
    ).toBe('/groups')
    expect(getSafeReturnTo(makeRequest('?returnTo=%2F%2Fevil.example'))).toBe(
      '/groups',
    )
  })

  it('returns a controlled error redirect when authorization cannot start', async () => {
    signInSocial.mockResolvedValue({
      headers: new Headers(),
      response: { redirect: false, url: undefined },
    })

    const response = await GET(makeRequest())

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://jec-spliit.vercel.app/?error=auth_start_failed',
    )
  })

  it('returns a controlled error redirect when Better Auth throws', async () => {
    signInSocial.mockRejectedValue(new Error('provider unavailable'))

    const response = await GET(makeRequest())

    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'https://jec-spliit.vercel.app/?error=auth_start_failed',
    )
  })
})
