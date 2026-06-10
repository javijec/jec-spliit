import { auth } from '@/lib/better-auth'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  await auth.api.signOut({
    headers: request.headers,
  })

  return NextResponse.redirect(new URL('/', request.url))
}
